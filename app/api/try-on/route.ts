import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

type JewelryType = 'ring' | 'necklace' | 'earring'
type DisplayType = 'woman' | 'stand'
const VALID_JEWELRY_TYPES: JewelryType[] = ['ring', 'necklace', 'earring']
const VALID_DISPLAY_TYPES: DisplayType[] = ['woman', 'stand']

const folderMap: Record<DisplayType, Record<JewelryType, string>> = {
  woman: { ring: 'ring', necklace: 'necklace', earring: 'kupe' },
  stand: { ring: 'ring', necklace: 'necklace', earring: 'kupe' },
}

const skinTones = ['fair skin', 'olive skin', 'dark skin', 'light brown skin']
const backgrounds = ['white studio', 'soft beige', 'dark luxury', 'marble texture', 'outdoor soft light']
const angles = ['front view', 'side angle', 'close-up detail', '45 degree angle']

function buildPrompts(): Record<JewelryType, string> {
  const randomSkin = skinTones[Math.floor(Math.random() * skinTones.length)]
  const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)]
  const randomAngle = angles[Math.floor(Math.random() * angles.length)]

  return {
    ring:     `Elegant woman's hand with ${randomSkin} and manicured nails wearing this exact ring, ${randomBg} background, ${randomAngle}, luxury jewelry photography, ultra realistic`,
    necklace: `Beautiful woman with ${randomSkin} wearing this exact necklace around her neck, ${randomBg} background, ${randomAngle}, luxury fashion photography, ultra realistic`,
    earring:  `Elegant woman with ${randomSkin} wearing this exact earring, ${randomBg} background, ${randomAngle}, luxury jewelry photography, ultra realistic`,
  }
}


type NanoBananaResult = {
  images: Array<{ url: string }>
}

type ClarityUpscaleResult = {
  image: { url: string }
}

async function upscaleImage(imageUrl: string): Promise<string> {
  try {
    const result = await fal.subscribe('fal-ai/clarity-upscaler', {
      input: {
        image_url: imageUrl,
        scale: 2,
        prompt: 'jewelry, ultra detailed, sharp focus, high resolution',
        creativity: 0.1,
        resemblance: 1.0,
      },
    }) as { data: ClarityUpscaleResult }
    return result.data.image.url
  } catch (err) {
    console.error('Upscale failed, returning original:', err)
    return imageUrl
  }
}

export async function POST(req: NextRequest) {
  // 1. İstek gövdesinden imageBase64, jewelryType, displayType ve quantity al
  let imageBase64: string, jewelryType: JewelryType, displayType: DisplayType, quantity: number
  try {
    const body = await req.json()
    ;({ imageBase64, jewelryType } = body as { imageBase64: string; jewelryType: JewelryType })
    displayType = (body.displayType as DisplayType) || 'woman'
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

  if (!VALID_DISPLAY_TYPES.includes(displayType)) {
    return NextResponse.json(
      { error: `Geçersiz displayType. Geçerli değerler: ${VALID_DISPLAY_TYPES.join(', ')}` },
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

  // 4. Klasörden referans görselleri listele
  const folder = `models/${displayType}/${folderMap[displayType][jewelryType]}`
  const modelsDir = path.join(process.cwd(), 'public', folder)

  let files: string[]
  try {
    files = fs.readdirSync(modelsDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  } catch {
    return NextResponse.json(
      { error: `Model klasörü bulunamadı: public/${folder}/` },
      { status: 500 }
    )
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: `public/${folder}/ klasöründe görsel yok` },
      { status: 500 }
    )
  }

  // STAND MODE
  if (displayType === 'stand') {
    const standPrompts: Record<JewelryType, string> = {
      ring: `The exact same ring from the second image, naturally resting on the jewelry stand from the first image. Preserve every detail of the ring perfectly: identical metal color, identical gemstone, identical design, identical proportions. The ring must look physically integrated with the stand — lighting and shadows match the stand's light source, soft natural shadow cast on the stand surface, stand fabric texture subtly visible beneath the ring base. Seamless photorealistic composite, no harsh edges, luxury product photography, ultra sharp focus, no modifications to the ring design`,
      necklace: `The exact same necklace from the second image, naturally draped on the jewelry stand from the first image. Preserve every detail perfectly: identical metal, identical pendants, identical chain, identical proportions. The necklace must look physically integrated with the stand — lighting and shadows match the stand's light source, soft natural shadow on the stand surface, stand fabric texture visible beneath the chain. Seamless photorealistic composite, no harsh edges, luxury jewelry photography, ultra sharp focus, no modifications to the necklace design`,
      earring: `The exact same earring from the second image, naturally placed on the jewelry stand from the first image. Preserve every detail perfectly: identical metal, identical stones, identical design, identical proportions. The earring must look physically integrated with the stand — lighting and shadows match the stand's light source, soft natural shadow cast on the stand surface. Seamless photorealistic composite, no harsh edges, luxury product photography, ultra sharp focus, no modifications to the earring design`,
    }

    const standJewelryBuffer = Buffer.from(imageBase64, 'base64')
    const standJewelryBlob = new Blob([standJewelryBuffer], { type: 'image/jpeg' })
    const uploadedJewelryUrl = await fal.storage.upload(standJewelryBlob)

    const standResults = await Promise.allSettled(
      Array.from({ length: quantity }, () => {
        const selectedFile = files[Math.floor(Math.random() * files.length)]
        const standImagePath = path.join(process.cwd(), 'public', folder, selectedFile)
        const standImageBuffer = fs.readFileSync(standImagePath)
        const standImageBlob = new Blob([standImageBuffer], { type: 'image/jpeg' })

        return fal.storage.upload(standImageBlob).then((standImageUrl: string) =>
          fal.subscribe('fal-ai/nano-banana-pro/edit', {
            input: {
              image_urls: [standImageUrl, uploadedJewelryUrl],
              prompt: standPrompts[jewelryType],
            },
          })
        )
      })
    )

    const standOutputUrls: string[] = []

    await Promise.all(
      standResults.map(async (result) => {
        if (result.status === 'fulfilled') {
          const rawUrl = (result.value.data as NanoBananaResult).images[0].url
          const outputUrl = await upscaleImage(rawUrl)

          await supabaseAdmin.from('generations').insert({
            user_id: user.id,
            jewelry_type: jewelryType,
            status: 'done',
            credits_used: 1,
            output_image_url: outputUrl,
          })

          standOutputUrls.push(outputUrl)
        } else {
          console.error('Stand nano-banana error:', JSON.stringify(result.reason, null, 2))

          await supabaseAdmin.from('generations').insert({
            user_id: user.id,
            jewelry_type: jewelryType,
            status: 'failed',
            credits_used: 1,
          })
        }
      })
    )

    if (standOutputUrls.length === 0) {
      return NextResponse.json({ error: 'Tüm üretimler başarısız' }, { status: 502 })
    }

    return NextResponse.json({ outputUrls: standOutputUrls, generationId: null })
  }

  // WOMAN MODE — fal.ai / Nano Banana akışı
  const randomFile = files[Math.floor(Math.random() * files.length)]
  const modelImageUrl = `https://jewelry-virtual.vercel.app/${folder}/${encodeURIComponent(randomFile)}`
  console.log('Seçilen referans model:', modelImageUrl)

  // 5. Takı görselini fal.storage'a yükle (bir kez, tüm üretimler için)
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
  const uploadedImageUrl = await fal.storage.upload(imageBlob)
  console.log('Model URL:', modelImageUrl)
  console.log('Takı URL:', uploadedImageUrl)

  // 6. quantity kadar paralel Nano Banana çağrısı yap
  const prompt = buildPrompts()[jewelryType]

  const results = await Promise.allSettled(
    Array.from({ length: quantity }, () =>
      fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: {
          image_urls: [modelImageUrl, uploadedImageUrl],
          prompt,
        },
      })
    )
  )

  // 7. Her sonuç için ayrı generations kaydı aç
  const outputUrls: string[] = []

  await Promise.all(
    results.map(async (result) => {
      if (result.status === 'fulfilled') {
        const rawUrl = (result.value.data as NanoBananaResult).images[0].url
        const outputUrl = await upscaleImage(rawUrl)
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
