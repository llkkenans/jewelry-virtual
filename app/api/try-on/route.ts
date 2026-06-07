import { NextRequest, NextResponse } from 'next/server'
import { startGeneration, pollGeneration } from '@/lib/leonardo'
import { supabaseAdmin } from '@/lib/supabase/server'

const CONCEPT_PROMPTS: Record<string, string> = {
  ecommerce:  "Professional jewelry product photo, beautiful elegant woman's hand with manicured nails wearing this ring, white background, soft studio lighting, high-end jewelry photography, ultra realistic, 8k",
  studio:     "Luxury jewelry advertisement, beautiful woman wearing this necklace around her neck, professional studio lighting, dark bokeh background, high fashion editorial, ultra realistic",
  engagement: "Close up romantic photo, beautiful woman's hand with this engagement ring, soft natural light, shallow depth of field, luxury jewelry photography, ultra realistic",
  lifestyle:  "Beautiful stylish woman wearing these earrings, upscale cafe background, natural golden hour light, luxury lifestyle photography, fashion editorial, ultra realistic",
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

  // 5. Leonardo.ai ile görsel üret
  try {
    console.log('Leonardo generation başlatılıyor:', { concept, prompt: prompt.substring(0, 60) })
    const leonardoId = await startGeneration(prompt, imageBase64)
    console.log('Leonardo generationId:', leonardoId)

    const outputUrl = await pollGeneration(leonardoId)
    console.log('Leonardo output URL:', outputUrl)

    // 6. Sonuç URL'ini güncelle
    await supabaseAdmin
      .from('generations')
      .update({ status: 'done', output_image_url: outputUrl })
      .eq('id', generation.id)

    // 7. outputUrl dön
    return NextResponse.json({ outputUrl, generationId: generation.id })
  } catch (error) {
    console.error('Leonardo error:', JSON.stringify(error, null, 2))

    await supabaseAdmin
      .from('generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)

    return NextResponse.json({ error: 'Leonardo.ai işlemi başarısız' }, { status: 502 })
  }
}
