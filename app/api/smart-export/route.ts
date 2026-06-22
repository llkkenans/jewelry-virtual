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

  console.log('Smart Export called:', { format, imageUrl: imageUrl?.substring(0, 80) + '...' })

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
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      sourceBuffer = Buffer.from(await res.arrayBuffer())
    } else {
      sourceBuffer = await getFromR2(imageUrl)
    }
  } catch (err: unknown) {
    console.error('Smart Export - image fetch error:', String(err))
    return NextResponse.json(
      { error: 'Kaynak görsel alınamadı. Lütfen görseli yeniden üretip tekrar deneyin.' },
      { status: 400 }
    )
  }

  let outputBuffer: Buffer
  try {
    const meta = await sharp(sourceBuffer).metadata()
    console.log('Smart Export - source image:', meta.width, 'x', meta.height, meta.format)

    outputBuffer = await sharp(sourceBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 92 })
      .toBuffer()
  } catch (err: unknown) {
    console.error('Smart Export - sharp error:', String(err))
    return NextResponse.json(
      { error: 'Görsel işleme hatası: ' + String(err) },
      { status: 500 }
    )
  }

  const r2Key = `exports/${user.id}/${format}_${Date.now()}.jpg`
  try {
    await uploadToR2(outputBuffer, r2Key, 'image/jpeg')
  } catch (err: unknown) {
    console.error('Smart Export - R2 upload error:', String(err))
    return NextResponse.json(
      { error: 'Dışa aktarma kaydedilemedi' },
      { status: 502 }
    )
  }

  const exportUrl = await getPresignedUrl(r2Key, 3600)
  return NextResponse.json({ exportUrl })
}
