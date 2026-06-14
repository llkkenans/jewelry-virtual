import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/r2'

type JewelryType = 'ring' | 'necklace' | 'earring' | 'watch'
type SkinTone    = 'ivory' | 'sand' | 'honey' | 'caramel' | 'espresso'
type Background  = 'pure_white' | 'soft_grey' | 'golden_hour' | 'marble_luxe' | 'noir'
type Ethnicity   = 'european' | 'asian' | 'afro' | 'middleeastern'
type NailStyle   = 'natural' | 'french' | 'red' | 'dark'

const VALID_JEWELRY_TYPES: JewelryType[] = ['ring', 'necklace', 'earring', 'watch']

const SKIN_TONE_PROMPTS: Record<SkinTone, string> = {
  ivory:    'very fair porcelain skin tone, light pink undertone',
  sand:     'light warm sand skin tone, golden undertone',
  honey:    'medium warm honey skin tone, golden wheat complexion',
  caramel:  'medium-dark caramel skin tone, rich warm complexion',
  espresso: 'deep dark espresso skin tone, rich deep complexion',
}

const BACKGROUND_PROMPTS: Record<Background, string> = {
  pure_white:  'clean pure white studio background, seamless white backdrop',
  soft_grey:   'soft neutral grey editorial background, subtle gradient',
  golden_hour: 'warm golden hour light background, soft amber glow, bokeh',
  marble_luxe: 'luxury white marble background with subtle grey veining',
  noir:        'dramatic deep black background, dark luxury atmosphere',
}

const ETHNICITY_PROMPTS: Record<Ethnicity, string> = {
  european:     'European features, light complexion',
  asian:        'East Asian features, smooth complexion',
  afro:         'African features, rich complexion',
  middleeastern: 'Middle Eastern features, warm olive complexion',
}

const NAIL_STYLE_PROMPTS: Record<NailStyle, string> = {
  natural: 'natural clean nails, no polish',
  french:  'french manicure nails, white tips',
  red:     'matte red nail polish',
  dark:    'dark burgundy nail polish',
}

function buildPrompt(
  displayType: 'woman' | 'man',
  jewelryType: JewelryType,
  skinTone: SkinTone,
  background: Background,
  ethnicity: Ethnicity,
  nailStyle: NailStyle
): string {
  const skin      = SKIN_TONE_PROMPTS[skinTone]
  const bg        = BACKGROUND_PROMPTS[background]
  const ethDetail = ETHNICITY_PROMPTS[ethnicity]

  const subjectMap: Record<JewelryType, { woman: string; man: string }> = {
    ring: {
      woman: `elegant woman's hand with ${skin}, ${ethDetail}, ${NAIL_STYLE_PROMPTS[nailStyle]}, wearing this exact ring on her finger`,
      man:   `elegant man's hand with ${skin}, ${ethDetail}, clean nails, wearing this exact ring on his finger`,
    },
    necklace: {
      woman: `beautiful woman with ${skin}, ${ethDetail}, wearing this exact necklace around her neck, décolleté visible, elegant posture`,
      man:   `handsome man with ${skin}, ${ethDetail}, wearing this exact necklace around his neck, collar open, confident posture`,
    },
    earring: {
      woman: `elegant woman with ${skin}, ${ethDetail}, wearing this exact earring on her ear, hair swept aside to reveal the earring clearly`,
      man:   `stylish man with ${skin}, ${ethDetail}, wearing this exact earring on his ear, hair swept aside`,
    },
    watch: {
      woman: `elegant woman's wrist with ${skin}, ${ethDetail}, wearing this exact watch on her wrist, sleek and refined`,
      man:   `strong man's wrist with ${skin}, ${ethDetail}, wearing this exact watch on his wrist, powerful and refined`,
    },
  }

  const subject = subjectMap[jewelryType][displayType]

  return [
    subject,
    bg,
    'luxury jewelry product photography',
    'ultra realistic, 8K, sharp focus, professional lighting',
    'the jewelry must be identical to the reference image',
  ].join(', ')
}

type NanoBananaResult = {
  images: Array<{ url: string }>
}

type ClarityUpscaleResult = {
  image: { url: string }
}

async function saveToR2(imageUrl: string, userId: string): Promise<string> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return imageUrl
    const buffer = Buffer.from(await res.arrayBuffer())
    const key = `outputs/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const publicUrl = await uploadToR2(buffer, key, 'image/jpeg')
    return publicUrl
  } catch (err) {
    console.error('R2 upload failed, returning original:', err)
    return imageUrl
  }
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
  let imageBase64: string, jewelryType: JewelryType, quantity: number, displayType: 'woman' | 'man', skinTone: SkinTone, background: Background, ethnicity: Ethnicity, nailStyle: NailStyle
  try {
    const body = await req.json()
    ;({ imageBase64, jewelryType } = body as { imageBase64: string; jewelryType: JewelryType })
    quantity    = Math.min(Math.max(Number(body.quantity) || 1, 1), 4)
    displayType = body.displayType  ?? 'woman'
    skinTone    = (body.skinTone    as SkinTone)   ?? 'sand'
    background  = (body.background  as Background) ?? 'pure_white'
    ethnicity   = (body.ethnicity   as Ethnicity)  ?? 'european'
    nailStyle   = (body.nailStyle   as NailStyle)  ?? 'natural'
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

  const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

  let modelImageUrl: string
  if (jewelryType === 'ring' && displayType === 'woman') {
    modelImageUrl = `${R2_PUBLIC_URL}/references/${jewelryType}/${displayType}/${ethnicity}/${skinTone}/${nailStyle}.jpg`
  } else {
    modelImageUrl = `${R2_PUBLIC_URL}/references/${jewelryType}/${displayType}/${ethnicity}/${skinTone}.jpg`
  }

  const prompt = buildPrompt(displayType, jewelryType, skinTone, background, ethnicity, nailStyle)

  console.log('── try-on params ──')
  console.log('displayType:', displayType, '| jewelryType:', jewelryType)
  console.log('skinTone:', skinTone, '| ethnicity:', ethnicity)
  console.log('nailStyle:', nailStyle, '| background:', background)
  console.log('modelImageUrl:', modelImageUrl)
  console.log('prompt:', prompt)

  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
  const uploadedImageUrl = await fal.storage.upload(imageBlob)
  console.log('Takı URL:', uploadedImageUrl)

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
        const upscaledUrl = await upscaleImage(rawUrl)
        const outputUrl = await saveToR2(upscaledUrl, user.id)
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
