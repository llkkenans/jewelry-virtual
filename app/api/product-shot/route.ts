import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateProductShot, uploadProductImage, VALID_SCENE_TYPES, CREDITS_PER_SCENE } from '@/lib/product-shot'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  let imageBase64: string, scene_type: string, shadow_intensity: string

  try {
    const body = await req.json()
    ;({ imageBase64, scene_type } = body as { imageBase64: string; scene_type: string })
    shadow_intensity = (body.shadow_intensity as string) ?? 'medium'
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  const MAX_BASE64_SIZE = 10 * 1024 * 1024
  if (imageBase64 && imageBase64.length > MAX_BASE64_SIZE) {
    return NextResponse.json({ error: 'Görsel çok büyük. Lütfen 7MB altında bir görsel yükleyin.' }, { status: 413 })
  }

  if (!imageBase64 || !scene_type) {
    return NextResponse.json(
      { error: 'Eksik parametre: imageBase64, scene_type gerekli' },
      { status: 400 }
    )
  }

  if (!VALID_SCENE_TYPES.includes(scene_type)) {
    return NextResponse.json(
      { error: `Geçersiz scene_type. Geçerli değerler: ${VALID_SCENE_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < CREDITS_PER_SCENE) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  const { allowed, resetAt } = await checkRateLimit(user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toISOString(),
        },
      }
    )
  }

  const falImageUrl = await uploadProductImage(imageBase64)

  const outcome = await generateProductShot(falImageUrl, scene_type, shadow_intensity)

  if (outcome.status === 'failed') {
    await supabaseAdmin.from('product_generations').insert({
      user_id: user.id,
      original_image_url: falImageUrl,
      scene_type,
      status: 'failed',
      credits_used: 0,
    })
    return NextResponse.json({ error: 'Görsel üretimi başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  const insertPayload = {
    user_id: user.id,
    original_image_url: falImageUrl,
    scene_type,
    status: 'done',
    credits_used: CREDITS_PER_SCENE,
    output_image_url: outcome.r2Key,
    is_saved: false,
  }
  console.log('DB INSERT attempt:', { userId: user.id, scene_type, r2Key: outcome.r2Key })

  const { data: genRecord, error: insertError } = await supabaseAdmin
    .from('product_generations')
    .insert(insertPayload)
    .select('id')
    .single()

  console.log('DB INSERT result:', { id: genRecord?.id ?? null, error: insertError?.message ?? null })

  if (insertError) {
    console.error('product_generations INSERT failed:', insertError)
    // Still return the image — just without a saveable generationId
    return NextResponse.json({
      outputUrl: outcome.presignedUrl,
      generationId: null,
      warning: `DB insert failed: ${insertError.message}`,
    })
  }

  return NextResponse.json({
    outputUrl: outcome.presignedUrl,
    generationId: genRecord!.id,
  })
}
