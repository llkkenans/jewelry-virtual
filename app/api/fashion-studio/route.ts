import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { runFashn } from '@/lib/fashn-client'

export const maxDuration = 60

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

  if (!profile || profile.credits < 1) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // Parse request
  let productImage: string, mode: string, avatarId: string | undefined, prompt: string | undefined
  try {
    const body = await req.json()
    productImage = body.productImage
    mode = body.mode ?? 'auto'
    avatarId = body.avatarId
    prompt = body.prompt
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!productImage) {
    return NextResponse.json({ error: 'Ürün görseli gerekli (productImage)' }, { status: 400 })
  }

  // Build FASHN inputs
  const inputs: Record<string, unknown> = {
    product_image: productImage,
    output_format: 'png',
  }

  if (prompt) {
    inputs.prompt = prompt
  }

  if (mode === 'avatar' && avatarId) {
    const faceKey = `clothing-references/avatars/${avatarId}/preview.png`
    try {
      const faceUrl = await getPresignedUrl(faceKey, 3600)
      inputs.face_reference = faceUrl
    } catch (err) {
      console.error('Avatar face fetch failed:', faceKey, err)
      return NextResponse.json({ error: 'Avatar görseli bulunamadı' }, { status: 400 })
    }
  }

  // Call FASHN
  let result
  try {
    result = await runFashn('product-to-model', inputs)
  } catch (err) {
    console.error('FASHN product-to-model error:', err)

    await supabaseAdmin
      .from('clothing_generations')
      .insert({
        user_id: user.id,
        category: 'auto',
        scene_type: mode,
        avatar_id: avatarId ?? null,
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
    outputKey = `outputs/${user.id}/fashion/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
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
      category: 'auto',
      scene_type: mode,
      avatar_id: avatarId ?? null,
      status: 'done',
      credits_used: 1,
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
