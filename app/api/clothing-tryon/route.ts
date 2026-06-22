import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getFromR2, uploadToR2 } from '@/lib/r2'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

type Gender = 'woman' | 'man'
type SkinTone = 'light' | 'medium' | 'dark'
type Category = 'tops' | 'bottoms' | 'one-pieces'

const VALID_CATEGORIES: Category[] = ['tops', 'bottoms', 'one-pieces']
const VALID_GENDERS: Gender[] = ['woman', 'man']
const VALID_SKIN_TONES: SkinTone[] = ['light', 'medium', 'dark']

const POSE_COUNTS: Record<Gender, number> = {
  woman: 9,
  man: 3,
}

type FashnResult = {
  images: Array<{ url: string }>
}

// "bottoms" kategorisi için Trendyol standardına uygun crop: yüz/baş gösterilmez,
// görselin bel-altı kısmı (alt %62) kullanılır. "tops" ve "one-pieces" tam boy kalır.
// Trendyol örnek satıcı görselleri incelenerek belirlendi (2026-06-19).
const BOTTOMS_CROP_RATIO = 0.62

async function cropForCategory(imageBuffer: Buffer, category: Category): Promise<Buffer> {
  if (category !== 'bottoms') {
    return imageBuffer
  }

  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width ?? 576
  const height = metadata.height ?? 864
  const cropTop = Math.round(height * (1 - BOTTOMS_CROP_RATIO))

  return sharp(imageBuffer)
    .extract({ left: 0, top: cropTop, width, height: height - cropTop })
    .toBuffer()
}

export async function POST(req: NextRequest) {
  let imageBase64: string, category: Category, gender: Gender, skinTone: SkinTone, avatarId: string | undefined, scene: string
  try {
    const body = await req.json()
    ;({ imageBase64, category } = body as { imageBase64: string; category: Category })
    avatarId = body.avatarId as string | undefined
    scene = (body.scene as string) ?? 'studio'
    gender = (body.gender as Gender) ?? 'woman'
    skinTone = (body.skinTone as SkinTone) ?? 'medium'
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  const MAX_BASE64_SIZE = 10 * 1024 * 1024
  if (imageBase64 && imageBase64.length > MAX_BASE64_SIZE) {
    return NextResponse.json({ error: 'Görsel çok büyük. Lütfen 7MB altında bir görsel yükleyin.' }, { status: 413 })
  }

  if (!imageBase64 || !category) {
    return NextResponse.json(
      { error: 'Eksik parametre: imageBase64, category gerekli' },
      { status: 400 }
    )
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `Geçersiz category. Geçerli değerler: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    )
  }

  // gender/skinTone validation only needed when not using an avatar
  if (!avatarId) {
    if (!VALID_GENDERS.includes(gender)) {
      return NextResponse.json(
        { error: `Geçersiz gender. Geçerli değerler: ${VALID_GENDERS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!VALID_SKIN_TONES.includes(skinTone)) {
      return NextResponse.json(
        { error: `Geçersiz skinTone. Geçerli değerler: ${VALID_SKIN_TONES.join(', ')}` },
        { status: 400 }
      )
    }
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

  if (!profile || profile.credits < 1) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  const { allowed, remaining, resetAt } = await checkRateLimit(user.id)
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

  let modelImageUrl: string
  let effectiveGender: Gender = gender
  let effectiveSkinTone: SkinTone = skinTone

  if (avatarId) {
    const { data: avatar, error: avatarError } = await supabaseAdmin
      .from('avatars')
      .select('id, gender, skin_tone, pose_count')
      .eq('id', avatarId)
      .eq('is_active', true)
      .single()

    if (avatarError || !avatar) {
      return NextResponse.json({ error: 'Avatar bulunamadı' }, { status: 400 })
    }

    effectiveGender = avatar.gender as Gender
    effectiveSkinTone = avatar.skin_tone as SkinTone

    const poseIndex = Math.floor(Math.random() * avatar.pose_count) + 1
    const avatarKey = `clothing-references/avatars/${avatarId}/${scene}/${poseIndex}.png`

    try {
      const avatarBuffer = await getFromR2(avatarKey)
      const avatarBlob = new Blob([avatarBuffer], { type: 'image/png' })
      modelImageUrl = await fal.storage.upload(avatarBlob)
    } catch (err) {
      console.error('R2 avatar fetch failed for key:', avatarKey, err)
      return NextResponse.json({
        error: 'Avatar görseli yüklenemedi. Lütfen tekrar deneyin.'
      }, { status: 500 })
    }
  } else {
    const randomIndex = Math.floor(Math.random() * POSE_COUNTS[gender]) + 1
    const r2Key = `clothing-references/${gender}/${skinTone}/${randomIndex}.png`

    try {
      const modelImageBuffer = await getFromR2(r2Key)
      const modelBlob = new Blob([modelImageBuffer], { type: 'image/png' })
      modelImageUrl = await fal.storage.upload(modelBlob)
    } catch (err) {
      console.error('R2 model fetch failed for key:', r2Key, err)

      if (randomIndex !== 1) {
        const fallbackKey = `clothing-references/${gender}/${skinTone}/1.png`
        try {
          const fallbackBuffer = await getFromR2(fallbackKey)
          const fallbackBlob = new Blob([fallbackBuffer], { type: 'image/png' })
          modelImageUrl = await fal.storage.upload(fallbackBlob)
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackKey, fallbackErr)
          return NextResponse.json({
            error: 'Üretim sırasında bir sorun oluştu. Lütfen tekrar deneyin.'
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({
          error: `Referans görsel bulunamadı: ${r2Key}. Lütfen bu görselin R2'ye yüklendiğinden emin olun.`
        }, { status: 500 })
      }
    }
  }

  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
  const garmentImageUrl = await fal.storage.upload(imageBlob)

  let result
  try {
    result = await fal.subscribe('fal-ai/fashn/tryon/v1.5', {
      input: {
        model_image: modelImageUrl,
        garment_image: garmentImageUrl,
        category,
        garment_photo_type: 'auto',
        mode: 'balanced',
      },
    })
  } catch (err) {
    console.error('FASHN error:', JSON.stringify(err, null, 2))

    await supabaseAdmin
      .from('clothing_generations')
      .insert({
        user_id: user.id,
        category,
        gender: effectiveGender,
        skin_tone: effectiveSkinTone,
        avatar_id: avatarId ?? null,
        scene_type: avatarId ? scene : null,
        status: 'failed',
        credits_used: 0,
      })

    return NextResponse.json({ error: 'Üretim başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  const rawOutputUrl = (result.data as FashnResult).images[0].url

  // "bottoms" kategorisi için: crop → clarity-upscaler (2x) → R2 + fal.storage.
  // Crop veya upscale başarısız olursa sessizce bir önceki adımın çıktısını kullan.
  // "tops" ve "one-pieces" için fal.media URL'i olduğu gibi kullanılır.
  let outputUrl = rawOutputUrl
  if (category === 'bottoms') {
    try {
      const fashnImageRes = await fetch(rawOutputUrl)
      const fashnImageBuffer = Buffer.from(await fashnImageRes.arrayBuffer())
      const croppedBuffer = await cropForCategory(fashnImageBuffer, category)

      // Kırpılmış görseli upscale için önce fal.storage'a yükle (URL gerekiyor)
      const croppedBlob = new Blob([croppedBuffer], { type: 'image/jpeg' })
      const croppedFalUrl = await fal.storage.upload(croppedBlob)

      let finalBuffer = croppedBuffer
      let finalFalUrl = croppedFalUrl
      try {
        const upscaleResult = await fal.subscribe('fal-ai/clarity-upscaler', {
          input: {
            image_url: croppedFalUrl,
            upscale_factor: 2,
            prompt: 'clothing, fashion, detailed fabric texture, sharp focus, high resolution',
            creativity: 0.1,
            resemblance: 1.0,
          },
        }) as { data: { image: { url: string } } }
        const upscaledUrl = upscaleResult.data.image.url
        const upscaledRes = await fetch(upscaledUrl)
        finalBuffer = Buffer.from(await upscaledRes.arrayBuffer())
        finalFalUrl = upscaledUrl
      } catch (upscaleErr) {
        console.error('Bottoms upscale failed, using cropped image without upscale:', upscaleErr)
      }

      const outputKey = `outputs/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      await uploadToR2(finalBuffer, outputKey, 'image/jpeg')
      outputUrl = finalFalUrl
    } catch (cropErr) {
      console.error('Crop failed, falling back to uncropped output:', cropErr)
      outputUrl = rawOutputUrl
    }
  }

  const { data: genRecord } = await supabaseAdmin
    .from('clothing_generations')
    .insert({
      user_id: user.id,
      category,
      gender: effectiveGender,
      skin_tone: effectiveSkinTone,
      avatar_id: avatarId ?? null,
      scene_type: avatarId ? scene : null,
      status: 'done',
      credits_used: 1,
      output_image_url: outputUrl,
      is_saved: false,
    })
    .select('id')
    .single()

  return NextResponse.json({
    outputUrl,
    generationId: genRecord?.id ?? null,
  })
}
