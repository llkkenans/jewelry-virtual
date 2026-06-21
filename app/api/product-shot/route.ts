import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateProductShot, uploadProductImage, uploadImageFromUrl, VALID_SCENE_TYPES, INDUSTRY_SCENES, CREDITS_PER_SCENE } from '@/lib/product-shot'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  let imageBase64: string, scene_type: string, shadow_intensity: string,
    industry: string | undefined, industry_scene: string | undefined,
    brand_scene_id: string | undefined

  try {
    const body = await req.json()
    ;({ imageBase64, scene_type, industry, industry_scene, brand_scene_id } = body as {
      imageBase64: string
      scene_type: string
      industry?: string
      industry_scene?: string
      brand_scene_id?: string
    })
    shadow_intensity = (body.shadow_intensity as string) ?? 'medium'
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  const MAX_BASE64_SIZE = 10 * 1024 * 1024
  if (imageBase64 && imageBase64.length > MAX_BASE64_SIZE) {
    return NextResponse.json({ error: 'Görsel çok büyük. Lütfen 7MB altında bir görsel yükleyin.' }, { status: 413 })
  }

  const useIndustryScene = !!(industry && industry_scene)
  const useBrandScene = !!brand_scene_id

  if (!imageBase64) {
    return NextResponse.json({ error: 'Eksik parametre: imageBase64 gerekli' }, { status: 400 })
  }

  let resolvedPrompt: string | undefined
  let effectiveSceneType = ''

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

  // Resolve scene routing after auth (brand_scene requires DB lookup)
  let referenceImageFalUrl: string | undefined

  if (useBrandScene) {
    const { data: brandScene, error: bsError } = await supabaseAdmin
      .from('brand_scenes')
      .select('reference_image_url, scene_prompt')
      .eq('id', brand_scene_id!)
      .eq('user_id', user.id)
      .single()

    if (bsError || !brandScene) {
      return NextResponse.json({ error: 'Brand sahne bulunamadı' }, { status: 404 })
    }

    referenceImageFalUrl = await uploadImageFromUrl(brandScene.reference_image_url)
    effectiveSceneType = `brand_scene/${brand_scene_id}`
  } else if (useIndustryScene) {
    const industryGroup = INDUSTRY_SCENES[industry!]
    if (!industryGroup) {
      return NextResponse.json(
        { error: `Geçersiz industry. Geçerli değerler: ${Object.keys(INDUSTRY_SCENES).join(', ')}` },
        { status: 400 }
      )
    }
    const prompt = industryGroup[industry_scene!]
    if (!prompt) {
      return NextResponse.json(
        { error: `Geçersiz industry_scene '${industry_scene}' için '${industry}'. Geçerli değerler: ${Object.keys(industryGroup).join(', ')}` },
        { status: 400 }
      )
    }
    resolvedPrompt = prompt
    effectiveSceneType = `${industry}/${industry_scene}`
  } else {
    if (!scene_type) {
      return NextResponse.json(
        { error: 'Eksik parametre: scene_type, industry+industry_scene veya brand_scene_id gerekli' },
        { status: 400 }
      )
    }
    if (!VALID_SCENE_TYPES.includes(scene_type)) {
      return NextResponse.json(
        { error: `Geçersiz scene_type. Geçerli değerler: ${VALID_SCENE_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
    effectiveSceneType = scene_type
  }

  const falImageUrl = await uploadProductImage(imageBase64)

  const outcome = await generateProductShot(falImageUrl, effectiveSceneType, shadow_intensity, resolvedPrompt, referenceImageFalUrl)

  if (outcome.status === 'failed') {
    await supabaseAdmin.from('product_generations').insert({
      user_id: user.id,
      original_image_url: falImageUrl,
      scene_type: effectiveSceneType,
      status: 'failed',
      credits_used: 0,
    })
    return NextResponse.json({ error: 'Görsel üretimi başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  const insertPayload = {
    user_id: user.id,
    original_image_url: falImageUrl,
    scene_type: effectiveSceneType,
    status: 'done',
    credits_used: CREDITS_PER_SCENE,
    output_image_url: outcome.r2Key,
    is_saved: false,
  }
  console.log('DB INSERT attempt:', { userId: user.id, scene_type: effectiveSceneType, r2Key: outcome.r2Key })

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
      dbError: insertError.message || "unknown insert error",
    })
  }

  return NextResponse.json({
    outputUrl: outcome.presignedUrl,
    generationId: genRecord!.id,
  })
}
