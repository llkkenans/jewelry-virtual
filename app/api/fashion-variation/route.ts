// Uses FASHN model-create with image_reference — "model-variation" does not exist
// in the FASHN SDK. model-create + image_reference generates a new model image
// guided by the structural composition of the reference photo.
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { runFashn } from '@/lib/fashn-client'

export const maxDuration = 60

const VARIATION_CREDIT_COST = 2

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

  // Credit check
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < VARIATION_CREDIT_COST) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // Parse body
  let sourceImageUrl: string, strength: 'subtle' | 'strong'
  try {
    const body = await req.json()
    sourceImageUrl = body.sourceImageUrl
    strength = body.strength ?? 'subtle'
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!sourceImageUrl) {
    return NextResponse.json({ error: 'Kaynak görsel gerekli (sourceImageUrl)' }, { status: 400 })
  }

  // generation_mode maps variation strength: subtle → fast (preserve more), strong → balanced
  const generationMode = strength === 'strong' ? 'balanced' : 'fast'

  // Call FASHN model-create with image_reference for structural guidance
  let result
  try {
    result = await runFashn('model-create', {
      prompt: 'fashion model, professional photography',
      image_reference: sourceImageUrl,
      generation_mode: generationMode,
      output_format: 'png',
    })
  } catch (err) {
    console.error('FASHN model-create (variation) error:', err)

    await supabaseAdmin
      .from('clothing_generations')
      .insert({
        user_id: user.id,
        category: 'variation',
        status: 'failed',
        credits_used: 0,
      })

    return NextResponse.json({ error: 'Varyasyon oluşturma başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  if (!result.output || result.output.length === 0) {
    return NextResponse.json({ error: 'Çıktı üretilemedi' }, { status: 500 })
  }

  // Download output and store in R2
  const fashnOutputUrl = result.output[0]
  let outputUrl: string

  try {
    const outputResponse = await fetch(fashnOutputUrl)
    const outputBuffer = Buffer.from(await outputResponse.arrayBuffer())
    const outputKey = `outputs/${user.id}/fashion/${Date.now()}-variation.png`
    await uploadToR2(outputBuffer, outputKey, 'image/png')
    outputUrl = await getPresignedUrl(outputKey, 3600)
  } catch (err) {
    console.error('R2 upload failed, returning FASHN URL:', err)
    outputUrl = fashnOutputUrl
  }

  // Save to DB
  const { data: genRecord, error: dbError } = await supabaseAdmin
    .from('clothing_generations')
    .insert({
      user_id: user.id,
      category: 'variation',
      status: 'done',
      credits_used: VARIATION_CREDIT_COST,
      output_image_url: outputUrl,
      is_saved: false,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('DB insert error:', dbError)
  }

  return NextResponse.json({
    outputUrl,
    generationId: genRecord?.id ?? null,
    fashnId: result.id,
  })
}
