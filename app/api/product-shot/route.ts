import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 120

const SCENE_PROMPTS: Record<string, string> = {
  ecommerce: "Transform this into a professional e-commerce product photograph. Place the product centered on a pure white seamless background. Add soft studio lighting from above-left with a fill light from the right creating gentle, natural shadows beneath the product. The product must look razor-sharp with accurate colors, textures, and reflective surfaces. Shoot style: 85mm lens, f/8, commercial catalog photography. No props, no distractions — clean, premium, ready for online store listing.",

  marble: "Transform this into a luxury product photograph on a polished Calacatta marble surface with subtle grey veining. Soft directional window light from the left side creates elegant shadows and gentle highlights on the marble. The product sits naturally on the surface with realistic contact shadow and subtle reflection on the polished stone. Background softly blurs into a warm neutral tone. Shoot style: 50mm lens, f/2.8, shallow depth of field, Vogue still-life aesthetic.",

  lifestyle: "Transform this into a warm lifestyle product photograph. Place the product naturally on a rustic wooden table in a cozy cafe setting. Include subtle background elements: a ceramic coffee cup slightly out of focus, warm ambient light streaming through a window, a soft knit textile draped nearby. The product is the hero but feels at home in the scene. Warm color temperature around 3500K. Shoot style: 35mm lens, f/2.0, editorial lifestyle photography with natural bokeh.",

  nature: "Transform this into an organic outdoor product photograph. Place the product on a natural stone or moss-covered surface in a lush garden setting. Soft dappled sunlight filtering through leaves creates natural light patterns. Background shows soft-focus greenery and wildflowers. Morning golden hour lighting with gentle lens flare. The product feels grounded in nature with realistic shadows on the organic surface. Shoot style: 50mm lens, f/2.8, organic beauty brand aesthetic.",

  minimal: "Transform this into a minimalist Scandinavian-style product photograph. Place the product on a warm sand-beige linen surface. Ultra-soft diffused lighting from a large overhead softbox creates almost shadowless illumination with just a hint of depth. Background is a smooth gradient from warm beige to soft cream. The entire image feels calm, premium, and intentional. Shoot style: 90mm macro lens, f/5.6, Kinfolk magazine aesthetic, desaturated warm tones.",

  dark_luxury: "Transform this into a dramatic dark luxury product photograph. Place the product on a matte black surface with subtle texture. Single focused spotlight from above-right creates a dramatic rim light on the product edges while the face stays softly lit. Deep black background fading to pure darkness. Subtle golden accent light kissing the product from behind. Realistic specular highlights and reflections on the dark surface. Shoot style: 100mm macro lens, f/4, high-end watch/jewelry brand campaign aesthetic.",
}

const VALID_SCENE_TYPES = Object.keys(SCENE_PROMPTS)
const CREDITS_REQUIRED = 1

type GptImageEditResult = {
  data?: { images?: Array<{ url?: string }> }
  images?: Array<{ url?: string }>
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

  let rawOutputUrl: string
  try {
    const result = await fal.subscribe('openai/gpt-image-2/edit', {
      input: {
        prompt,
        image_urls: [productImageUrl],
        image_size: 'auto',
        quality: 'low',
        num_images: 1,
        output_format: 'png',
      },
    }) as GptImageEditResult
    const url = result.data?.images?.[0]?.url ?? result.images?.[0]?.url
    if (!url) throw new Error('gpt-image-2/edit: output URL bulunamadı')
    rawOutputUrl = url
  } catch (err) {
    console.error('openai/gpt-image-2/edit error:', JSON.stringify(err, null, 2))
    await supabaseAdmin.from('product_generations').insert({
      user_id: user.id,
      original_image_url: productImageUrl,
      scene_type,
      status: 'failed',
      credits_used: 0,
    })
    return NextResponse.json({ error: 'Görsel üretimi başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  // R2'ye kaydet, presigned URL üret
  const outputKey = `outputs/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
  let presignedUrl: string

  try {
    const res = await fetch(rawOutputUrl)
    if (!res.ok) throw new Error(`fal fetch failed: ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    await uploadToR2(buffer, outputKey, 'image/png')
    presignedUrl = await getPresignedUrl(outputKey, 3600)
  } catch (err) {
    console.error('R2 save failed, falling back to fal URL:', err)
    presignedUrl = rawOutputUrl
  }

  const { data: genRecord } = await supabaseAdmin
    .from('product_generations')
    .insert({
      user_id: user.id,
      original_image_url: productImageUrl,
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
