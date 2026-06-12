import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import path from 'path'
import fs from 'fs'

type JewelryType = 'ring' | 'necklace' | 'earring' | 'watch'
const VALID_JEWELRY_TYPES: JewelryType[] = ['ring', 'necklace', 'earring', 'watch']

const folderMap: Record<JewelryType, string> = {
  ring: 'ring',
  necklace: 'necklace',
  earring: 'kupe',
  watch: 'watch',
}

const manFolderMap: Record<JewelryType, string> = {
  ring: 'ring',
  necklace: 'necklace',
  earring: 'earring',
  watch: 'watch',
}

const skinTones = ['fair skin', 'olive skin', 'dark skin', 'light brown skin']
const backgrounds = ['white studio', 'soft beige', 'dark luxury', 'marble texture', 'outdoor soft light']
const angles = ['front view', 'side angle', 'close-up detail', '45 degree angle']

function buildPrompts(displayType: 'woman' | 'man'): Record<JewelryType, string> {
  const randomSkin = skinTones[Math.floor(Math.random() * skinTones.length)]
  const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)]
  const randomAngle = angles[Math.floor(Math.random() * angles.length)]

  if (displayType === 'man') {
    return {
      ring:     `Elegant man's hand with ${randomSkin} wearing this exact ring, ${randomBg} background, ${randomAngle}, luxury jewelry photography, ultra realistic`,
      necklace: `Handsome man with ${randomSkin} wearing this exact necklace around his neck, ${randomBg} background, ${randomAngle}, luxury fashion photography, ultra realistic`,
      earring:  `Stylish man with ${randomSkin} wearing this exact earring, ${randomBg} background, ${randomAngle}, luxury jewelry photography, ultra realistic`,
      watch:    `Elegant man's wrist with ${randomSkin} wearing this exact watch, ${randomBg} background, ${randomAngle}, luxury watch photography, ultra realistic`,
    }
  }

  return {
    ring:     `Elegant woman's hand with ${randomSkin} and manicured nails wearing this exact ring, ${randomBg} background, ${randomAngle}, luxury jewelry photography, ultra realistic`,
    necklace: `Beautiful woman with ${randomSkin} wearing this exact necklace around her neck, ${randomBg} background, ${randomAngle}, luxury fashion photography, ultra realistic`,
    earring:  `Elegant woman with ${randomSkin} wearing this exact earring, ${randomBg} background, ${randomAngle}, luxury jewelry photography, ultra realistic`,
    watch:    `Elegant woman's wrist with ${randomSkin} wearing this exact watch, ${randomBg} background, ${randomAngle}, luxury watch photography, ultra realistic`,
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
        upscaling_factor: 2,
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
  let imageBase64: string, jewelryType: JewelryType, quantity: number, displayType: 'woman' | 'man'
  try {
    const body = await req.json()
    ;({ imageBase64, jewelryType } = body as { imageBase64: string; jewelryType: JewelryType })
    quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 4)
    displayType = body.displayType ?? 'woman'
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

  if (!profile || profile.credits < quantity) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  const gender = displayType === 'man' ? 'man' : 'woman'
  const folder = `models/${gender}/${displayType === 'man' ? manFolderMap[jewelryType] : folderMap[jewelryType]}`
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

  const randomFile = files[Math.floor(Math.random() * files.length)]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jewelry-virtual.vercel.app'
  const modelImageUrl = `${appUrl}/${folder}/${encodeURIComponent(randomFile)}`
  console.log('Seçilen referans model:', modelImageUrl)

  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
  const uploadedImageUrl = await fal.storage.upload(imageBlob)
  console.log('Model URL:', modelImageUrl)
  console.log('Takı URL:', uploadedImageUrl)

  const prompt = buildPrompts(displayType)[jewelryType]

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
