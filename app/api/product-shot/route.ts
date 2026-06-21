import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

const SCENE_PROMPTS: Record<string, string> = {
  ecommerce:   "Place this product on a clean white studio background with soft professional lighting and subtle shadows, e-commerce product photography style",
  marble:      "Place this product on an elegant marble surface with soft natural light, luxury product photography, high-end brand aesthetic",
  lifestyle:   "Place this product on a warm wooden table in a cozy cafe setting, lifestyle product photography with natural warm tones",
  nature:      "Place this product in a natural outdoor setting with soft green foliage and natural sunlight, organic lifestyle photography",
  minimal:     "Place this product on a beige/sand-toned studio background with minimalist styling, soft diffused light, Scandinavian aesthetic",
  dark_luxury: "Place this product on a dark matte black surface with dramatic studio lighting, luxury brand photography with gold accent lighting",
}

const VALID_SCENE_TYPES = Object.keys(SCENE_PROMPTS)
const CREDITS_REQUIRED = 2

type NanoBananaResult = {
  images: Array<{ url: string }>
}

export async function POST(req: NextRequest) {
  let imageBase64: string, scene_type: string

  try {
    const body = await req.json()
    ;({ imageBase64, scene_type } = body as { imageBase64: string; scene_type: string })
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

  if (!profile || profile.credits < CREDITS_REQUIRED) {
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

  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
  const productImageUrl = await fal.storage.upload(imageBlob)

  const prompt = SCENE_PROMPTS[scene_type]

  let result
  try {
    result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
      input: {
        image_urls: [productImageUrl],
        prompt,
      },
    })
  } catch (err) {
    console.error('nano-banana-pro/edit error:', JSON.stringify(err, null, 2))

    await supabaseAdmin
      .from('product_generations')
      .insert({
        user_id: user.id,
        scene_type,
        status: 'failed',
        credits_used: 0,
      })

    return NextResponse.json({ error: 'Üretim başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  const rawOutputUrl = (result.data as NanoBananaResult).images[0].url

  // Fetch from fal.ai and save to R2 (R2 public URLs return 403 — use presigned URLs)
  const outputKey = `outputs/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  let presignedUrl: string

  try {
    const res = await fetch(rawOutputUrl)
    if (!res.ok) throw new Error(`fal fetch failed: ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    await uploadToR2(buffer, outputKey, 'image/jpeg')
    presignedUrl = await getPresignedUrl(outputKey, 3600)
  } catch (err) {
    console.error('R2 save failed, falling back to fal URL:', err)
    presignedUrl = rawOutputUrl
  }

  const { data: genRecord } = await supabaseAdmin
    .from('product_generations')
    .insert({
      user_id: user.id,
      scene_type,
      status: 'done',
      credits_used: CREDITS_REQUIRED,
      output_image_url: outputKey,
      is_saved: false,
    })
    .select('id')
    .single()

  return NextResponse.json({
    outputUrl: presignedUrl,
    generationId: genRecord?.id ?? null,
  })
}
