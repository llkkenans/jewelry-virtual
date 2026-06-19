import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getFromR2 } from '@/lib/r2'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

type Gender = 'woman' | 'man'
type SkinTone = 'light' | 'medium' | 'dark'
type Category = 'tops' | 'bottoms' | 'one-pieces'

const VALID_CATEGORIES: Category[] = ['tops', 'bottoms', 'one-pieces']
const VALID_GENDERS: Gender[] = ['woman', 'man']
const VALID_SKIN_TONES: SkinTone[] = ['light', 'medium', 'dark']

// Her gender/skinTone kombinasyonu için R2'de kaç poz görseli var (1.png, 2.png, 3.png...)
// Jewelry REFERENCE_COUNTS pattern'iyle tutarlı.
const POSE_COUNT = 3

type FashnResult = {
  images: Array<{ url: string }>
}

export async function POST(req: NextRequest) {
  let imageBase64: string, category: Category, gender: Gender, skinTone: SkinTone
  try {
    const body = await req.json()
    ;({ imageBase64, category } = body as { imageBase64: string; category: Category })
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

  // Tam vücut referans model seçimi — her gender/skinTone kombinasyonu için
  // 3 poz görseli var (1.png, 2.png, 3.png), rastgele seçilir.
  // Klasör yapısı: clothing-references/{gender}/{skinTone}/{index}.png
  const randomIndex = Math.floor(Math.random() * POSE_COUNT) + 1
  const r2Key = `clothing-references/${gender}/${skinTone}/${randomIndex}.png`

  let modelImageUrl: string
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
        gender,
        skin_tone: skinTone,
        status: 'failed',
        credits_used: 0,
      })

    return NextResponse.json({ error: 'Üretim başarısız oldu. Lütfen tekrar deneyin.' }, { status: 502 })
  }

  const outputUrl = (result.data as FashnResult).images[0].url

  const { data: genRecord } = await supabaseAdmin
    .from('clothing_generations')
    .insert({
      user_id: user.id,
      category,
      gender,
      skin_tone: skinTone,
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
