import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

type JewelryType = 'ring' | 'necklace' | 'earring'
const VALID_JEWELRY_TYPES: JewelryType[] = ['ring', 'necklace', 'earring']

const FOLDER_MAP: Record<JewelryType, string> = {
  ring:     'ring',
  necklace: 'necklace',
  earring:  'kupe',
}

const skinTones = ['fair skin', 'olive skin', 'dark skin', 'light brown skin']
const backgrounds = ['white studio', 'soft beige', 'dark luxury', 'marble texture', 'outdoor soft light']
const angles = ['front view', 'side angle', 'close-up detail', '45 degree angle']

function buildPrompt(jewelryType: JewelryType): string {
  const randomSkin = skinTones[Math.floor(Math.random() * skinTones.length)]
  const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)]
  const randomAngle = angles[Math.floor(Math.random() * angles.length)]

  const prompts: Record<JewelryType, string> = {
    ring:     `Elegant woman's hand with ${randomSkin} and manicured nails wearing this exact ring, ${randomBg} background, ${randomAngle}, luxury jewelry photography, ultra realistic`,
    necklace: `Beautiful woman with ${randomSkin} wearing this exact necklace around her neck, ${randomBg} background, ${randomAngle}, luxury fashion photography, ultra realistic`,
    earring:  `Elegant woman with ${randomSkin} wearing this exact earring, ${randomBg} background, ${randomAngle}, luxury jewelry photography, ultra realistic`,
  }
  return prompts[jewelryType]
}

type NanoBananaResult = {
  images: Array<{ url: string }>
}

export async function POST(req: NextRequest) {
  // 1. İstek gövdesinden imageBase64, jewelryType ve quantity al
  let imageBase64: string, jewelryType: JewelryType, quantity: number
  try {
    const body = await req.json()
    ;({ imageBase64, jewelryType } = body as { imageBase64: string; jewelryType: JewelryType })
    quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 4)
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!imageBase64 || !jewelryType) {
    return NextResponse.json(
      { error: 'Eksik parametre: imageBase64, jewelryType gerekli' },
      { status: 400 }
    )
  }

  if (!VALID_JEWELRY_TYPES.includes(jewelryType)) {
    return NextResponse.json(
      { error: `Geçersiz jewelryType. Geçerli değerler: ${VALID_JEWELRY_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // 2. Supabase session doğrula
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  // 3. Kredi kontrolü — quantity kadar kredi gerekli
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < quantity) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // 4. Klasörden rastgele referans model görseli seç
  const folder = FOLDER_MAP[jewelryType]
  const modelsDir = path.join(process.cwd(), 'public', 'models', folder)

  let files: string[]
  try {
    files = fs.readdirSync(modelsDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  } catch {
    return NextResponse.json(
      { error: `Model klasörü bulunamadı: public/models/${folder}/` },
      { status: 500 }
    )
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: `public/models/${folder}/ klasöründe görsel yok` },
      { status: 500 }
    )
  }

  const randomFile = files[Math.floor(Math.random() * files.length)]
  const modelImageUrl = `https://jewelry-virtual.vercel.app/models/${folder}/${encodeURIComponent(randomFile)}`
  console.log('Seçilen referans model:', modelImageUrl)

  // 5. Takı görselini fal.storage'a yükle (bir kez, tüm üretimler için)
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
  const uploadedImageUrl = await fal.storage.upload(imageBlob)
  console.log('Model URL:', modelImageUrl)
  console.log('Takı URL:', uploadedImageUrl)

  // 6. quantity kadar paralel Nano Banana çağrısı yap
  const results = await Promise.allSettled(
    Array.from({ length: quantity }, () =>
      fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: {
          image_url: modelImageUrl,
          image_urls: [uploadedImageUrl],
          prompt: buildPrompt(jewelryType),
          image_size: { width: 1024, height: 1024 },
        },
      })
    )
  )

  // 7. Her sonuç için ayrı generations kaydı aç
  const outputUrls: string[] = []

  await Promise.all(
    results.map(async (result) => {
      if (result.status === 'fulfilled') {
        const outputUrl = (result.value.data as NanoBananaResult).images[0].url
        console.log('Nano Banana output URL:', outputUrl)

        await supabaseAdmin
          .from('generations')
          .insert({
            user_id: user.id,
            jewelry_type: jewelryType,
            status: 'done',
            credits_used: 1,
            output_image_url: outputUrl,
          })

        outputUrls.push(outputUrl)
      } else {
        console.error('Nano Banana error:', JSON.stringify(result.reason, null, 2))

        await supabaseAdmin
          .from('generations')
          .insert({
            user_id: user.id,
            jewelry_type: jewelryType,
            status: 'failed',
            credits_used: 1,
          })
      }
    })
  )

  if (outputUrls.length === 0) {
    return NextResponse.json({ error: 'Tüm üretimler başarısız' }, { status: 502 })
  }

  return NextResponse.json({ outputUrls, generationId: null })
}
