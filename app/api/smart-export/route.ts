import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl, getFromR2 } from '@/lib/r2'
import sharp from 'sharp'

const FORMAT_SPECS: Record<string, { width: number; height: number; padding: number }> = {
  square:     { width: 1000, height: 1000, padding: 0.12 },
  vertical:   { width: 1200, height: 1800, padding: 0.10 },
  horizontal: { width: 1600, height: 900,  padding: 0.10 },
  amazon:     { width: 2000, height: 2000, padding: 0.08 },
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  let imageUrl: string, format: string, customWidth: number | undefined, customHeight: number | undefined
  try {
    ;({ imageUrl, format, customWidth, customHeight } = await req.json() as {
      imageUrl: string
      format: string
      customWidth?: number
      customHeight?: number
    })
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!imageUrl || !format) {
    return NextResponse.json({ error: 'Eksik parametre: imageUrl, format gerekli' }, { status: 400 })
  }

  const validFormats = [...Object.keys(FORMAT_SPECS), 'custom']
  if (!validFormats.includes(format)) {
    return NextResponse.json(
      { error: `Geçersiz format. Geçerli değerler: ${validFormats.join(', ')}` },
      { status: 400 }
    )
  }

  let targetWidth: number, targetHeight: number, padding: number
  if (format === 'custom') {
    if (!customWidth || !customHeight || customWidth < 1 || customHeight < 1) {
      return NextResponse.json(
        { error: 'custom format için customWidth ve customHeight gerekli' },
        { status: 400 }
      )
    }
    targetWidth = customWidth
    targetHeight = customHeight
    padding = 0.10
  } else {
    const spec = FORMAT_SPECS[format]
    targetWidth = spec.width
    targetHeight = spec.height
    padding = spec.padding
  }

  let sourceBuffer: Buffer
  try {
    // imageUrl may be an R2 key or a presigned/external URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error(`Görsel alınamadı: ${res.status}`)
      sourceBuffer = Buffer.from(await res.arrayBuffer())
    } else {
      sourceBuffer = await getFromR2(imageUrl)
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Kaynak görsel alınamadı', details: String(err) },
      { status: 502 }
    )
  }

  let outputBuffer: Buffer
  try {
    const paddingH = Math.round(targetWidth * padding)
    const paddingV = Math.round(targetHeight * padding)
    const innerWidth = targetWidth - paddingH * 2
    const innerHeight = targetHeight - paddingV * 2

    outputBuffer = await sharp(sourceBuffer)
      .resize(innerWidth, innerHeight, { fit: 'contain', background: '#FFFFFF' })
      .extend({
        top: paddingV,
        bottom: paddingV,
        left: paddingH,
        right: paddingH,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .resize(targetWidth, targetHeight)
      .jpeg({ quality: 92 })
      .toBuffer()
  } catch (err) {
    return NextResponse.json(
      { error: 'Görsel işleme hatası', details: String(err) },
      { status: 500 }
    )
  }

  const r2Key = `exports/${user.id}/${format}_${Date.now()}.jpg`
  try {
    await uploadToR2(outputBuffer, r2Key, 'image/jpeg')
  } catch (err) {
    return NextResponse.json(
      { error: 'R2 yükleme hatası', details: String(err) },
      { status: 502 }
    )
  }

  const exportUrl = await getPresignedUrl(r2Key, 3600)
  return NextResponse.json({ exportUrl })
}
