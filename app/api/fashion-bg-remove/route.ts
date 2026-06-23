import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { runFashn } from '@/lib/fashn-client'

export const maxDuration = 60

const BG_REMOVE_CREDIT_COST = 1

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

  if (!profile || profile.credits < BG_REMOVE_CREDIT_COST) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // Parse body
  let sourceImageUrl: string
  try {
    const body = await req.json()
    sourceImageUrl = body.sourceImageUrl
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!sourceImageUrl) {
    return NextResponse.json({ error: 'Kaynak görsel gerekli (sourceImageUrl)' }, { status: 400 })
  }

  // Call FASHN background-remove
  let result
  try {
    result = await runFashn('background-remove', { image: sourceImageUrl })
  } catch (err) {
    console.error('FASHN background-remove error:', err)

    await supabaseAdmin
      .from('clothing_generations')
      .insert({
        user_id: user.id,
        category: 'bg-remove',
        status: 'failed',
        credits_used: 0,
      })

    return NextResponse.json({ error: 'Arkaplan kaldırma başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  if (!result.output || result.output.length === 0) {
    return NextResponse.json({ error: 'Çıktı üretilemedi' }, { status: 500 })
  }

  // Download transparent PNG and store in R2
  const fashnOutputUrl = result.output[0]
  let outputUrl: string

  try {
    const outputResponse = await fetch(fashnOutputUrl)
    const outputBuffer = Buffer.from(await outputResponse.arrayBuffer())
    const outputKey = `outputs/${user.id}/fashion/${Date.now()}-bg-remove.png`
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
      category: 'bg-remove',
      status: 'done',
      credits_used: BG_REMOVE_CREDIT_COST,
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
