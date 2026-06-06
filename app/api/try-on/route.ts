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
  // Auth
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
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

  // İstek gövdesi
  const body = await req.json()
  const { imageUrl, maskBase64, concept, jewelryItemId } = body as {
    imageUrl: string
    maskBase64: string
    concept: string
    jewelryItemId: string
  }

  if (!imageUrl || !maskBase64 || !concept || !jewelryItemId) {
    return NextResponse.json({ error: 'Eksik parametre: imageUrl, maskBase64, concept, jewelryItemId gerekli' }, { status: 400 })
  }

  const prompt = CONCEPT_PROMPTS[concept]
  if (!prompt) {
    return NextResponse.json(
      { error: `Geçersiz konsept. Geçerli değerler: ${Object.keys(CONCEPT_PROMPTS).join(', ')}` },
      { status: 400 }
    )
  }

  // Generation kaydını aç — INSERT trigger'ı krediyi düşürür
  const { data: generation, error: insertError } = await supabaseAdmin
    .from('generations')
    .insert({
      user_id: user.id,
      jewelry_item_id: jewelryItemId,
      concept,
      status: 'processing',
      credits_used: 1,
    })
    .select('id')
    .single()

  if (insertError || !generation) {
    return NextResponse.json({ error: 'Üretim kaydı oluşturulamadı' }, { status: 500 })
  }

  // fal.ai Flux Pro Fill (inpainting)
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1/fill', {
      input: {
        image_url: imageUrl,
        mask_url: maskBase64,   // data:image/png;base64,... kabul eder
        prompt,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'jpeg',
      },
    })

    const outputUrl = (result.data as FalFillResult).images[0].url

    await supabaseAdmin
      .from('generations')
      .update({ status: 'done', output_image_url: outputUrl })
      .eq('id', generation.id)

    return NextResponse.json({ outputUrl, generationId: generation.id })
  } catch {
    // Kredi düştü ama üretim başarısız — kaydı 'failed' yap
    await supabaseAdmin
      .from('generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)

    return NextResponse.json({ error: 'fal.ai işlemi başarısız' }, { status: 502 })
  }
}
