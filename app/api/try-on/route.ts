import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

type JewelryType = 'ring' | 'necklace' | 'bracelet'
const VALID_JEWELRY_TYPES: JewelryType[] = ['ring', 'necklace', 'bracelet']

const JEWELRY_PROMPTS: Record<string, string> = {
  ring:     "Place this exact ring naturally on the woman's ring finger. Match the lighting, preserve all ring details exactly, realistic skin texture.",
  necklace: "Place this exact necklace naturally around the woman's neck and collarbone. Match the lighting, preserve all necklace details exactly.",
  bracelet: "Place this exact bracelet naturally on the woman's wrist. Match the lighting, preserve all bracelet details exactly.",
}

type NanoBananaResult = {
  images: Array<{ url: string }>
}

export async function POST(req: NextRequest) {
  // 1. İstek gövdesinden imageBase64 ve jewelryType al
  let imageBase64: string, jewelryType: JewelryType
  try {
    const body = await req.json()
    ;({ imageBase64, jewelryType } = body as { imageBase64: string; jewelryType: JewelryType })
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!imageBase64 || !jewelryType) {
    return NextResponse.json(
      { error: 'Eksik parametre: imageBase64, jewelryType gerekli' },
      { status: 400 }
    )
  }

  if (!VALID_JEWELRY_TYPES.includes(jewelryType)) {
    return NextResponse.json(
      { error: `Geçersiz jewelryType. Geçerli değerler: ${VALID_JEWELRY_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // 2. Supabase session doğrula
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  // 3. Kredi kontrolü
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits <= 0) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // 4. public/models/{jewelryType}/ klasöründen rastgele model seç
  const modelsDir = path.join(process.cwd(), 'public', 'models', jewelryType)

  let files: string[]
  try {
    files = fs.readdirSync(modelsDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  } catch {
    return NextResponse.json(
      { error: `Model klasörü bulunamadı: public/models/${jewelryType}/` },
      { status: 500 }
    )
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: `public/models/${jewelryType}/ klasöründe görsel yok` },
      { status: 500 }
    )
  }

  const randomFile = files[Math.floor(Math.random() * files.length)]
  const modelUrl = `/models/${jewelryType}/${randomFile}`
  const modelImageUrl = `https://jewelry-virtual.vercel.app${modelUrl}`
  console.log('Seçilen model:', modelImageUrl)

  // 5. generations tablosuna kayıt aç — INSERT trigger'ı krediyi düşürür
  const { data: generation, error: insertError } = await supabaseAdmin
    .from('generations')
    .insert({
      user_id: user.id,
      concept: jewelryType,
      status: 'processing',
      credits_used: 1,
    })
    .select('id')
    .single()

  if (insertError || !generation) {
    return NextResponse.json({ error: 'Üretim kaydı oluşturulamadı' }, { status: 500 })
  }

  // 6. Nano Banana ile gerçek entegrasyon
  try {
    // Kullanıcının takı görselini fal.storage'a yükle
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
    const uploadedImageUrl = await fal.storage.upload(imageBlob)
    console.log('fal storage URL:', uploadedImageUrl)

    const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
      input: {
        image_url: modelImageUrl,
        image_urls: [uploadedImageUrl],
        prompt: JEWELRY_PROMPTS[jewelryType],
        image_size: { width: 1024, height: 1024 },
      },
    })

    const outputUrl = (result.data as NanoBananaResult).images[0].url
    console.log('Nano Banana output URL:', outputUrl)

    // 7. Sonuç URL'ini güncelle
    await supabaseAdmin
      .from('generations')
      .update({ status: 'done', output_image_url: outputUrl })
      .eq('id', generation.id)

    return NextResponse.json({ outputUrl, generationId: generation.id })
  } catch (error) {
    console.error('Nano Banana error:', JSON.stringify(error, null, 2))

    await supabaseAdmin
      .from('generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)

    return NextResponse.json({ error: 'Nano Banana işlemi başarısız' }, { status: 502 })
  }
}
