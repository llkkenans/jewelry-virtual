import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@/lib/fal'
import { supabaseAdmin } from '@/lib/supabase/server'

const CONCEPT_PROMPTS: Record<string, string> = {
  ecommerce:  'elegant hand wearing the ring, clean white studio background, professional product photography, soft shadows',
  studio:     'hand wearing the ring, professional studio lighting, bokeh background, high-end jewelry photography',
  engagement: 'romantic close-up of hand wearing the ring, soft natural light, engagement photography style',
  lifestyle:  'hand wearing the ring resting near a coffee cup, cozy cafe lifestyle photography, warm tones',
}

type FalFillResult = {
  images: Array<{ url: string; width: number; height: number; content_type: string }>
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

  // 5. fal.ai Flux Pro Fill — base64 prefix'ini temizle, sonra gönder
  const cleanImage = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
  const cleanMask  = maskBase64.replace(/^data:image\/[a-z]+;base64,/, '')

  console.log('fal params:', { image_url: imageBase64?.substring(0, 50), prompt, mask_url: maskBase64?.substring(0, 50) })

  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1/fill', {
      input: {
        image_url: cleanImage,
        prompt,
        mask_url: cleanMask,
      },
    })

    // 6. Sonuç URL'ini güncelle
    const outputUrl = (result.data as FalFillResult).images[0].url

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
