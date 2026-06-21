import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  generateProductShot,
  uploadProductImage,
  VALID_SCENE_TYPES,
  VALID_SHADOW_INTENSITIES,
  CREDITS_PER_SCENE,
} from '@/lib/product-shot'

export const maxDuration = 300

const BATCH_SCENES = VALID_SCENE_TYPES
const BATCH_CREDITS = BATCH_SCENES.length * CREDITS_PER_SCENE

export async function POST(req: NextRequest) {
  let imageBase64: string, shadow_intensity: string, batch_id: string

  try {
    const body = await req.json()
    ;({ imageBase64, batch_id } = body as { imageBase64: string; batch_id: string })
    shadow_intensity = (body.shadow_intensity as string) ?? 'medium'
  } catch (error) {
    return NextResponse.json({
      error: 'Geçersiz JSON gövdesi',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 400 })
  }

  const MAX_BASE64_SIZE = 10 * 1024 * 1024
  if (imageBase64 && imageBase64.length > MAX_BASE64_SIZE) {
    return NextResponse.json({ error: 'Görsel çok büyük. Lütfen 7MB altında bir görsel yükleyin.' }, { status: 413 })
  }

  if (!imageBase64 || !batch_id) {
    return NextResponse.json(
      { error: 'Eksik parametre: imageBase64, batch_id gerekli' },
      { status: 400 }
    )
  }

  if (!VALID_SHADOW_INTENSITIES.includes(shadow_intensity)) {
    return NextResponse.json(
      { error: `Geçersiz shadow_intensity. Geçerli değerler: ${VALID_SHADOW_INTENSITIES.join(', ')}` },
      { status: 400 }
    )
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  let userId: string
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Yetkisiz', details: authError?.message }, { status: 401 })
    }
    userId = user.id
    console.log('BATCH: Auth OK')
  } catch (error) {
    return NextResponse.json({
      error: 'Auth hatası',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }

  let credits: number
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!profile || profile.credits < BATCH_CREDITS) {
      return NextResponse.json(
        { error: `Yetersiz kredi. Batch üretim için en az ${BATCH_CREDITS} kredi gerekli.` },
        { status: 403 }
      )
    }
    credits = profile.credits
    console.log(`BATCH: Kredi OK, credits: ${credits}`)
  } catch (error) {
    return NextResponse.json({
      error: 'Profil sorgu hatası',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }

  try {
    const { allowed, resetAt } = await checkRateLimit(userId)
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
  } catch (error) {
    return NextResponse.json({
      error: 'Rate limit kontrol hatası',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }

  let falImageUrl: string
  try {
    falImageUrl = await uploadProductImage(imageBase64)
    console.log('BATCH: fal.storage upload OK')
  } catch (error) {
    return NextResponse.json({
      error: 'Görsel yükleme hatası (fal.storage)',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 502 })
  }

  console.log('BATCH: Starting 6 parallel generations')
  const settled = await Promise.allSettled(
    BATCH_SCENES.map(scene => generateProductShot(falImageUrl, scene, shadow_intensity))
  )

  const results = await Promise.all(
    BATCH_SCENES.map(async (scene, i) => {
      const result = settled[i]

      if (result.status === 'rejected' || result.value.status === 'failed') {
        const errorMsg = result.status === 'rejected'
          ? String(result.reason)
          : (result.value as { status: 'failed'; error: string }).error

        console.log(`BATCH: Scene ${scene} failed — ${errorMsg}`)

        await supabaseAdmin.from('product_generations').insert({
          user_id: userId,
          original_image_url: falImageUrl,
          scene_type: scene,
          batch_id,
          status: 'failed',
          credits_used: 0,
        })

        return { scene_type: scene, status: 'failed' as const, error: errorMsg }
      }

      const { r2Key, presignedUrl } = result.value
      console.log(`BATCH: Scene ${scene} completed`)

      const { data: genRecord } = await supabaseAdmin
        .from('product_generations')
        .insert({
          user_id: userId,
          original_image_url: falImageUrl,
          scene_type: scene,
          batch_id,
          status: 'done',
          credits_used: CREDITS_PER_SCENE,
          output_image_url: r2Key,
          is_saved: false,
        })
        .select('id')
        .single()

      return {
        scene_type: scene,
        status: 'success' as const,
        outputUrl: presignedUrl,
        generationId: genRecord?.id ?? null,
      }
    })
  )

  const successCount = results.filter(r => r.status === 'success').length

  return NextResponse.json({
    batch_id,
    results,
    summary: {
      total: BATCH_SCENES.length,
      success: successCount,
      failed: BATCH_SCENES.length - successCount,
      credits_used: successCount * CREDITS_PER_SCENE,
    },
  })
}
