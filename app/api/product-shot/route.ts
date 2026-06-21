import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 120

const SCENE_PROMPTS: Record<string, string> = {
  ecommerce:   "Clean white studio background, soft professional lighting, subtle shadows, e-commerce product photography",
  marble:      "Elegant marble surface, soft natural light, luxury product photography",
  lifestyle:   "Warm wooden table in a cozy cafe, lifestyle product photography with warm tones",
  nature:      "Natural outdoor setting with soft green foliage and natural sunlight",
  minimal:     "Beige sand-toned studio background, minimalist styling, soft diffused light",
  dark_luxury: "Dark matte black surface, dramatic studio lighting, luxury brand photography",
}

const VALID_SCENE_TYPES = Object.keys(SCENE_PROMPTS)
const CREDITS_REQUIRED = 1

type BriaRemoveResult = {
  data?: { image?: { url?: string }; images?: Array<{ url?: string }> }
  image?: { url?: string }
  images?: Array<{ url?: string }>
}

type BriaReplaceResult = {
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

  // Adım 1 — arka planı kaldır
  let cleanProductUrl: string
  try {
    const removeResult = await fal.subscribe('fal-ai/bria/background/remove', {
      input: { image_url: productImageUrl },
    }) as BriaRemoveResult
    const url = removeResult.data?.image?.url ?? removeResult.image?.url
    if (!url) throw new Error('background/remove: output URL bulunamadı')
    cleanProductUrl = url
  } catch (err) {
    console.error('bria/background/remove error:', JSON.stringify(err, null, 2))
    await supabaseAdmin.from('product_generations').insert({
      user_id: user.id,
      original_image_url: productImageUrl,
      scene_type,
      status: 'failed',
      credits_used: 0,
    })
    return NextResponse.json({ error: 'Arka plan kaldırma başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  // Adım 2 — yeni sahneye yerleştir
  let rawOutputUrl: string
  try {
    const replaceResult = await fal.subscribe('fal-ai/bria/background/replace', {
      input: {
        image_url: cleanProductUrl,
        prompt,
        refine_prompt: true,
        fast: false,
        num_images: 1,
      },
    }) as BriaReplaceResult
    const url = replaceResult.data?.images?.[0]?.url ?? replaceResult.images?.[0]?.url
    if (!url) throw new Error('background/replace: output URL bulunamadı')
    rawOutputUrl = url
  } catch (err) {
    console.error('bria/background/replace error:', JSON.stringify(err, null, 2))
    await supabaseAdmin.from('product_generations').insert({
      user_id: user.id,
      original_image_url: productImageUrl,
      scene_type,
      status: 'failed',
      credits_used: 0,
    })
    return NextResponse.json({ error: 'Sahne oluşturma başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

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
