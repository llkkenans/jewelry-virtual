import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'

const CONCEPT_PROMPTS: Record<string, string> = {
  ecommerce:  "Elegant woman's hand with manicured nails wearing the ring, white studio background, soft lighting",
  studio:     'Beautiful woman wearing the necklace, luxury studio photography, dramatic lighting, dark background',
  engagement: "Close-up of woman's hand wearing the ring, romantic soft light, shallow depth of field",
  lifestyle:  'Stylish woman wearing the earrings, upscale cafe, warm natural light',
}

type BriaResult = {
  images: Array<{ url: string }>
}

export async function POST(req: NextRequest) {
  // 1. İstek gövdesinden imageBase64 ve concept al
  let imageBase64: string, concept: string
  try {
    const body = await req.json()
    ;({ imageBase64, concept } = body as { imageBase64: string; concept: string })
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!imageBase64 || !concept) {
    return NextResponse.json(
      { error: 'Eksik parametre: imageBase64, concept gerekli' },
      { status: 400 }
    )
  }

  const sceneDescription = CONCEPT_PROMPTS[concept]
  if (!sceneDescription) {
    return NextResponse.json(
      { error: `Geçersiz konsept. Geçerli değerler: ${Object.keys(CONCEPT_PROMPTS).join(', ')}` },
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

  // 4. generations tablosuna kayıt aç — INSERT trigger'ı krediyi düşürür
  const { data: generation, error: insertError } = await supabaseAdmin
    .from('generations')
    .insert({
      user_id: user.id,
      concept,
      status: 'processing',
      credits_used: 1,
    })
    .select('id')
    .single()

  if (insertError || !generation) {
    return NextResponse.json({ error: 'Üretim kaydı oluşturulamadı' }, { status: 500 })
  }

  // 5. Bria Product Shot ile görsel üret
  try {
    // imageBase64 → Blob → fal.storage URL
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
    const uploadedImageUrl = await fal.storage.upload(imageBlob)
    console.log('fal storage URL:', uploadedImageUrl)

    const result = await fal.subscribe('fal-ai/bria/product-shot', {
      input: {
        image_url: uploadedImageUrl,
        scene_description: sceneDescription,
      },
    })

    const outputUrl = (result.data as BriaResult).images[0].url
    console.log('Bria output URL:', outputUrl)

    // 6. Sonuç URL'ini güncelle
    await supabaseAdmin
      .from('generations')
      .update({ status: 'done', output_image_url: outputUrl })
      .eq('id', generation.id)

    // 7. outputUrl dön
    return NextResponse.json({ outputUrl, generationId: generation.id })
  } catch (error) {
    console.error('Bria error:', JSON.stringify(error, null, 2))

    await supabaseAdmin
      .from('generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)

    return NextResponse.json({ error: 'Bria Product Shot işlemi başarısız' }, { status: 502 })
  }
}
