import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@/lib/fal'
import { supabaseAdmin } from '@/lib/supabase/server'

const CONCEPT_PROMPTS: Record<string, string> = {
  ecommerce:  "a woman's hand elegantly wearing this jewelry piece, white studio background, professional product photography",
  studio:     'a woman wearing this jewelry, professional studio lighting, high-end fashion photography, bokeh background',
  engagement: "close-up of a woman's hand wearing this ring, romantic soft light, engagement photography",
  lifestyle:  'a stylish woman wearing this jewelry, cozy cafe, warm lifestyle photography',
}

type FalResult = {
  image?: { url: string }
  images?: Array<{ url: string; width: number; height: number; content_type: string }>
}

export async function POST(req: NextRequest) {
  // 1. İstek gövdesinden imageBase64 ve concept al
  let imageBase64: string, maskBase64: string, concept: string
  try {
    const body = await req.json()
    ;({ imageBase64, maskBase64, concept } = body as {
      imageBase64: string
      maskBase64: string
      concept: string
    })
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!imageBase64 || !maskBase64 || !concept) {
    return NextResponse.json(
      { error: 'Eksik parametre: imageBase64, maskBase64, concept gerekli' },
      { status: 400 }
    )
  }

  const prompt = CONCEPT_PROMPTS[concept]
  if (!prompt) {
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

  // 5. fal.ai Flux Pro image-to-image — base64 prefix'ini temizle, fal.storage'a yükle
  const cleanImage = imageBase64.replace(/^data:image\/[a-z+]+;base64,/, '')

  console.log('fal params:', { image_url: imageBase64?.substring(0, 50), prompt })

  try {
    const imageFile = await fetch(`data:image/jpeg;base64,${cleanImage}`).then(r => r.blob())
    const uploadedImage = await fal.storage.upload(imageFile)

    const result = await fal.subscribe('fal-ai/flux-pro/v1/fill', {
      input: {
        image_url: uploadedImage,
        prompt,
      },
    })

    // 6. Sonuç URL'ini güncelle — modele göre response formatı değişiyor
    const data = result.data as FalResult
    const outputUrl = data?.image?.url ?? data?.images?.[0]?.url
    console.log('fal output URL:', outputUrl)

    if (!outputUrl) {
      throw new Error('fal.ai response içinde URL bulunamadı')
    }

    await supabaseAdmin
      .from('generations')
      .update({ status: 'done', output_image_url: outputUrl })
      .eq('id', generation.id)

    // 7. outputUrl dön
    return NextResponse.json({ outputUrl, generationId: generation.id })
  } catch (error) {
    console.error('fal.ai error:', JSON.stringify(error, null, 2))

    // Üretim başarısız — kaydı 'failed' yap (kredi iadesi yok)
    await supabaseAdmin
      .from('generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)

    return NextResponse.json({ error: 'fal.ai işlemi başarısız' }, { status: 502 })
  }
}
