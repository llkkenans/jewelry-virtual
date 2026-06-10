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

// Bir pikselin açık/beyaz arka plan olup olmadığını belirler (mask/route.ts ile aynı mantık)
function isBackground(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3
  const maxChannel = Math.max(r, g, b)
  const minChannel = Math.min(r, g, b)
  const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel
  return brightness > 220 && saturation < 0.15
}

// Takı görselinin arka planını şeffaflaştırır ve stant görseli üzerine ortalar
async function compositeJewelryOnStand(
  jewelryBase64: string,
  standImagePath: string
): Promise<string> {
  const jewelryBuffer = Buffer.from(
    jewelryBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
    'base64'
  )

  const { data: pixels, info } = await sharp(jewelryBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width: jW, height: jH } = info
  const transparent = Buffer.alloc(jW * jH * 4)

  for (let i = 0; i < jW * jH; i++) {
    const r = pixels[i * 4]
    const g = pixels[i * 4 + 1]
    const b = pixels[i * 4 + 2]
    const a = pixels[i * 4 + 3]

    if (a < 10 || isBackground(r, g, b)) {
      transparent[i * 4 + 3] = 0
    } else {
      transparent[i * 4]     = r
      transparent[i * 4 + 1] = g
      transparent[i * 4 + 2] = b
      transparent[i * 4 + 3] = a
    }
  }

  const jewelryPng = await sharp(transparent, {
    raw: { width: jW, height: jH, channels: 4 },
  })
    .png()
    .toBuffer()

  const { width: sW = 1024, height: sH = 1024 } = await sharp(standImagePath).metadata()
  const targetSize = Math.round(Math.min(sW, sH) * 0.65)

  const resized = await sharp(jewelryPng)
    .resize(targetSize, targetSize, { fit: 'inside', withoutEnlargement: false })
    .toBuffer()

  const { width: rW = targetSize, height: rH = targetSize } = await sharp(resized).metadata()
  const left = Math.round((sW - rW) / 2)
  const top  = Math.round((sH - rH) / 2)

  const composited = await sharp(standImagePath)
    .composite([{ input: resized, left, top, blend: 'over' }])
    .png()
    .toBuffer()

  return composited.toString('base64')
}

type NanoBananaResult = {
  images: Array<{ url: string }>
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

  // STAND MODE — fal.ai by-pass, Sharp ile deterministik compositing
  // Takı birebir korunur, yalnızca arka plan stant referansından alınır
  if (displayType === 'stand') {
    const standOutputUrls: string[] = []

    for (let i = 0; i < quantity; i++) {
      // Her generation için ayrı rastgele stant görseli seç (görsel çeşitlilik)
      const selectedFile = files[Math.floor(Math.random() * files.length)]
      const standPath = path.join(process.cwd(), 'public', folder, selectedFile)

      try {
        const b64 = await compositeJewelryOnStand(imageBase64, standPath)
        const outputUrl = `data:image/png;base64,${b64}`

        await supabaseAdmin.from('generations').insert({
          user_id: user.id,
          jewelry_type: jewelryType,
          status: 'done',
          credits_used: 1,
          output_image_url: outputUrl,
        })

        standOutputUrls.push(outputUrl)
      } catch (err) {
        console.error(`Stand composite error [${i}]:`, err)

        await supabaseAdmin.from('generations').insert({
          user_id: user.id,
          jewelry_type: jewelryType,
          status: 'failed',
          credits_used: 1,
        })
      }
    }

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
          image_url: modelImageUrl,
          image_urls: [uploadedImageUrl],
          prompt,
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
