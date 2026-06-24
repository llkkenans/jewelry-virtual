import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { runFashn } from '@/lib/fashn-client'

export const maxDuration = 60

const FACE_TO_MODEL_CREDIT_COST = 2

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

  if (!profile || profile.credits < FACE_TO_MODEL_CREDIT_COST) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // Parse request
  let faceImage: string
  let prompt: string | undefined
  try {
    const body = await req.json()
    faceImage = body.faceImage
    prompt = body.prompt
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!faceImage) {
    return NextResponse.json({ error: 'Yüz görseli gerekli (faceImage)' }, { status: 400 })
  }

  // Build FASHN inputs — face_image is the verified SDK field name
  const inputs: Record<string, unknown> = {
    face_image: faceImage,
    output_format: 'png',
    aspect_ratio: '2:3',
  }

  if (prompt) {
    inputs.prompt = prompt
  }

  // Call FASHN
  let result
  try {
    result = await runFashn('face-to-model', inputs)
  } catch (err) {
    console.error('FASHN face-to-model error:', err)

    await supabaseAdmin
      .from('clothing_generations')
      .insert({
        user_id: user.id,
        category: 'face-to-model',
        status: 'failed',
        credits_used: 0,
      })

    return NextResponse.json({ error: 'Üretim başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  if (!result.output || result.output.length === 0) {
    return NextResponse.json({ error: 'Çıktı üretilemedi' }, { status: 500 })
  }

  // Download output and store in R2
  const fashnOutputUrl = result.output[0]
  let outputKey: string
  let outputUrl: string

  try {
    const outputResponse = await fetch(fashnOutputUrl)
    const outputBuffer = Buffer.from(await outputResponse.arrayBuffer())
    outputKey = `outputs/${user.id}/fashion/${Date.now()}-face-to-model.png`
    await uploadToR2(outputBuffer, outputKey, 'image/png')
    outputUrl = await getPresignedUrl(outputKey, 3600)
  } catch (err) {
    console.error('R2 upload failed, returning FASHN URL:', err)
    outputKey = fashnOutputUrl
    outputUrl = fashnOutputUrl
  }

  // Save to DB
  const { data: genRecord, error: dbError } = await supabaseAdmin
    .from('clothing_generations')
    .insert({
      user_id: user.id,
      category: 'face-to-model',
      status: 'done',
      credits_used: FACE_TO_MODEL_CREDIT_COST,
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
