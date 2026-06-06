import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase/server'

// Bir pikselin açık/beyaz arkaplan olup olmadığını belirler.
// Yüksek parlaklık (R,G,B > 220) + kanallar arası düşük fark → arka plan
function isBackground(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3
  const maxChannel = Math.max(r, g, b)
  const minChannel = Math.min(r, g, b)
  const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel

  return brightness > 220 && saturation < 0.15
}

export async function POST(req: NextRequest) {
  // Auth: Bearer token ile kullanıcıyı doğrula
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  // Kredi kontrolü
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits <= 0) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // İstek gövdesinden görsel URL'ini al
  const body = await req.json()
  const { imageUrl } = body as { imageUrl: string }

  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl gerekli' }, { status: 400 })
  }

  // Görseli indir
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    return NextResponse.json({ error: 'Görsel indirilemedi' }, { status: 422 })
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

  // Görseli RGBA ham piksellere çevir
  const { data: pixels, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const maskData = Buffer.alloc(width * height)

  // Her piksel için arka plan tespiti → beyaz maske, takı → siyah maske
  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4]
    const g = pixels[i * 4 + 1]
    const b = pixels[i * 4 + 2]
    const a = pixels[i * 4 + 3]

    // Saydam piksel de arka plan sayılır
    maskData[i] = a < 10 || isBackground(r, g, b) ? 255 : 0
  }

  // Ham gri maskeden PNG oluştur
  const maskPng = await sharp(maskData, {
    raw: { width, height, channels: 1 },
  })
    .png()
    .toBuffer()

  const maskBase64 = `data:image/png;base64,${maskPng.toString('base64')}`

  return NextResponse.json({ maskBase64, width, height })
}
