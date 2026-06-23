import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { runFashn } from '@/lib/fashn-client'

export const maxDuration = 60

function calculateVideoCredits(resolution: string, duration: number): number {
  const base = resolution === '1080p' ? 6 : resolution === '720p' ? 3 : 1
  return duration >= 10 ? base * 2 : base
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

  // Parse request
  let sourceImageUrl: string, sourceStudio: string, resolution: string, duration: number
  try {
    const body = await req.json()
    sourceImageUrl = body.sourceImageUrl
    sourceStudio = body.sourceStudio ?? 'fashion'
    resolution = body.resolution ?? '720p'
    duration = body.duration ?? 5
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!sourceImageUrl) {
    return NextResponse.json({ error: 'Kaynak görsel gerekli (sourceImageUrl)' }, { status: 400 })
  }

  const creditCost = calculateVideoCredits(resolution, duration)

  // Credit check
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < creditCost) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // Call FASHN image-to-video
  let result
  try {
    result = await runFashn('image-to-video', { image: sourceImageUrl, resolution, duration })
  } catch (err) {
    console.error('FASHN image-to-video error:', err)

    await supabaseAdmin
      .from('video_generations')
      .insert({
        user_id: user.id,
        source_image_url: sourceImageUrl,
        source_studio: sourceStudio,
        status: 'failed',
        credits_used: 0,
      })

    return NextResponse.json({ error: 'Video üretimi başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  if (!result.output || result.output.length === 0) {
    return NextResponse.json({ error: 'Çıktı üretilemedi' }, { status: 500 })
  }

  // Download video and store in R2
  const fashnVideoUrl = result.output[0]
  let videoUrl: string

  try {
    const videoResponse = await fetch(fashnVideoUrl)
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
    const videoKey = `outputs/${user.id}/video/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
    await uploadToR2(videoBuffer, videoKey, 'video/mp4')
    videoUrl = await getPresignedUrl(videoKey, 3600)
  } catch (err) {
    console.error('R2 video upload failed, returning FASHN URL:', err)
    videoUrl = fashnVideoUrl
  }

  // Save to DB
  const { data: genRecord, error: dbError } = await supabaseAdmin
    .from('video_generations')
    .insert({
      user_id: user.id,
      source_image_url: sourceImageUrl,
      source_studio: sourceStudio,
      video_url: videoUrl,
      status: 'done',
      credits_used: creditCost,
      fashn_id: result.id,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('DB insert error:', dbError)
  }

  return NextResponse.json({
    videoUrl,
    generationId: genRecord?.id ?? null,
    fashnId: result.id,
  })
}
