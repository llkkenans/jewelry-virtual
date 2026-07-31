import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getFromR2, getPresignedUrl } from '@/lib/r2'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

type JewelryType = 'ring' | 'necklace' | 'earring' | 'watch'
type SkinTone    = 'ivory' | 'sand' | 'honey' | 'caramel' | 'espresso'
type Background  = 'pure_white' | 'soft_grey' | 'golden_hour' | 'marble_luxe' | 'noir'
type NailStyle   = 'natural' | 'french' | 'red' | 'dark'
type PromptKey   = `${JewelryType}/${string}/${SkinTone}`

const VALID_JEWELRY_TYPES: JewelryType[] = ['ring', 'necklace', 'earring', 'watch']

const COMPOSITION_VARIATIONS = [
  "vertical 3:4 framing, subject facing the camera straight on, the jewelry centered and large in the frame, plenty of headroom",
  "upper chest and neck crop, frontal angle, the piece filling the middle of the frame, everything in sharp focus including the nd wall",
  "head and shoulders, slight three-quarter turn toward the camera, the piece clearly readable and unobstructed",
  "casual handheld phone shot, camera slightly below eye level, the jewelry sharp and centered",
  "simple frontal portrait crop, arms relaxed and down, the piece unobstructed against plain skin",
  "close but not extreme crop, the jewelry occupying roughly a third of the frame height, natural perspective",
]

const LIGHTING_VARIATIONS = [
  "bright soft daylight from a large window just off to one side, airy and clean, gentle falloff, well exposed",
  "abundant natural daylight filling the room, luminous and fresh, very soft shadows, bright overall exposure",
  "clean frontal daylight from a wide window, bright and even, subtle shaping on the collarbones",
  "airy daylight bouncing off a white wall, bright and open, soft shadow edges",
  "gentle late-afternoon daylight through a window, softly warm and inviting, still neutral skin tones, no orange cast",
  "mild warm indoor daylight in the late afternoon, cosy and alive, soft warmth on the skin without any heavy golden grading",
]

const MOOD_VARIATIONS = [
  "relaxed confident expression, natural and self-assured",
  "plain marketplace product listing photo, honest and unstyled",
  "casual snapshot feeling, subject calm and natural",
  "simple catalogue photo, straightforward and elegant",
  "natural unposed moment, soft neutral expression",
  "clean commercial catalogue photo, effortless and composed",
]

const SKIN_TONE_DESCRIPTIONS: Record<string, string> = {
  ivory: "very fair porcelain skin",
  sand: "light wheat-toned Mediterranean skin",
  honey: "warm honey-toned olive skin",
  caramel: "medium-deep caramel brown skin",
  espresso: "deep espresso brown skin",
}

const PERSON_POSES = [
  "one hand raised gently to the side of her head, fingers in her hair, face turned toward the camera",
  "both hands holding the collar of an open shirt, chin lifted slightly, relaxed shoulders",
  "head tilted back, eyes softly closed, one hand resting on the opposite shoulder",
  "standing straight facing the camera, arms relaxed at her sides, calm direct gaze",
  "turned three-quarters away, looking back over her shoulder toward the camera",
  "one hand resting lightly on her collarbone, head slightly tilted, soft neutral expression",
]

const IPHONE_REALISM = "Shot on an iPhone main wide camera. Natural smartphone photo look: deep depth of field with the background almost in focus, no creamy bokeh, no lens compression. Natural skin texture with visible pores, but clear healthy flawless complexion with no blemishes, no acne, no dark spots, no under-eye circles, no wrinkles, matte skin, no beauty retouching, no airbrushing, no skin smoothing. Neutral white balance with no warm amber or golden cast. Plain bright white or very light warm-neutral wall background, clean and evenly lit, never dark or dingy grey. No sdio strobes, no softbox, no rim light, no backlight, no colored gel lighting, no gradient studio backdrop. Slight sensor noise. This is an e-commerce marketplace product listing photo, not a fashion campaign. Bright, well-exposed and airy overall — clean and fresh, never dim, murky, flat, underexposed or grey. Skin looks healthy and naturally luminous, not oily or retouched."

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const PROMPTS: Record<string, string> = {
  "ring/woman/ivory": "Photo of a woman's hand with porcelain ivory skin wearing this exact ring on the ring finger. Fingers relaxed and naturally curved, the band and stone clearly visible. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/woman/sand": "Photo of a woman's hand with light sand-toned skin wearing this exact ring on the ring finger. Fingers softly extended in a natural resting pose. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/woman/honey": "Photo of a woman's hand with honey-toned skin wearing this exact ring on the ring finger. Fingers gently curled in a natural pose. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/woman/caramel": "Photo of a woman's hand with caramel-brown skin wearing this exact ring on the ring finger. Fingers relaxed and slightly fanned. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/woman/espresso": "Photo of a woman's hand with deep espresso-brown skin wearing this exact ring on the ring finger. Fingers in a relaxed natural gesture. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/man/ivory": "Photo of a man's hand with fair ivory skin wearing this exact ring on the ring finger. Fingers naturally squared and relaxed. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/man/sand": "Photo of a man's hand with sand-toned skin wearing this exact ring on the ring finger. Fingers relaxed with visible tendon structure. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/man/honey": "Photo of a man's hand with honey-toned skin wearing this exact ring on the ring finger. Fingers naturally curled and defined. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/man/caramel": "Photo of a man's hand with caramel-brown skin wearing this exact ring on the ring finger. Fingers squared and relaxed. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "ring/man/espresso": "Photo of a man's hand with deep espresso-brown skin wearing this exact ring on the ring finger. Fingers in a steady natural pose. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/woman/ivory": "Photo of a woman with porcelain ivory skin wearing this exact necklace, the pendant resting centered just below the throat. Plain top or bare décolletage, no accessories competing with the piece. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/woman/sand": "Photo of a woman with sand-toned skin wearing this exact necklace, the pendant centered on the sternum. Plain top or bare décolletage. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/woman/honey": "Photo of a woman with honey-toned skin wearing this exact necklace, the pendant resting against the décolletage. Plain top or bare neckline. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/woman/caramel": "Photo of a woman with caramel-brown skin wearing this exact necklace, the pendant centered on the chest. Plain top or bare neckline. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/woman/espresso": "Photo of a woman with deep espresso-brown skin wearing this exact necklace, the pendant resting below the throat. Plain top or bare décolletage. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/man/ivory": "Photo of a man with fair ivory skin wearing this exact necklace, the pendant resting at the base of the throat. Plain t-shirt or open collar. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/man/sand": "Photo of a man with sand-toned skin wearing this exact necklace, pendant centered on the chest. Plain t-shirt or open collar. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/man/honey": "Photo of a man with honey-toned skin wearing this exact necklace across the neck and upper chest. Plain t-shirt or open collar. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/man/caramel": "Photo of a man with caramel-brown skin wearing this exact necklace, pendant centered on the chest. Plain t-shirt or open collar. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "necklace/man/espresso": "Photo of a man with deep espresso-brown skin wearing this exact necklace at the throat and chest. Plain t-shirt or open collar. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/woman/ivory": "Photo of a woman with porcelain ivory skin wearing this exact earring, head turned in a soft three-quarter profile so the ear and earring are clearly visible. Hair tucked back behind the ear. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/woman/sand": "Photo of a woman with sand-toned skin wearing this exact earring, profile angled to display the ear clearly. Hair tucked back. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/woman/honey": "Photo of a woman with honey-toned skin wearing this exact earring, head in a soft three-quarter turn revealing the ear. Hair tucked back. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/woman/caramel": "Photo of a woman with caramel-brown skin wearing this exact earring, profile turned to showcase the ear. Hair tucked back. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/woman/espresso": "Photo of a woman with deep espresso-brown skin wearing this exact earring, head angled in a three-quarter profile. Hair tucked back. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/man/ivory": "Photo of a man with fair ivory skin wearing this exact earring, head in a three-quarter profile revealing the ear. Short cropped hair. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/man/sand": "Photo of a man with sand-toned skin wearing this exact earring, profile angled to display the ear. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/man/honey": "Photo of a man with honey-toned skin wearing this exact earring, head in a soft three-quarter turn revealing the ear. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/man/caramel": "Photo of a man with caramel-brown skin wearing this exact earring, profile turned to showcase the ear. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "earring/man/espresso": "Photo of a man with deep espresso-brown skin wearing this exact earring, head angled in a three-quarter profile. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/woman/ivory": "Photo of a woman's wrist with porcelain ivory skin wearing this exact watch, wrist angled to display the dial face clearly. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/woman/sand": "Photo of a woman's wrist with sand-toned skin wearing this exact watch, wrist turned to reveal the dial and crown. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/woman/honey": "Photo of a woman's wrist with honey-toned skin wearing this exact watch, wrist angled to showcase the dial. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/woman/caramel": "Photo of a woman's wrist with caramel-brown skin wearing this exact watch, wrist rotated to display the dial face. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/woman/espresso": "Photo of a woman's wrist with deep espresso-brown skin wearing this exact watch, wrist angled to reveal the dial. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/man/ivory": "Photo of a man's wrist with fair ivory skin wearing this exact watch, wrist angled to display the dial face over a defined forearm. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/man/sand": "Photo of a man's wrist with sand-toned skin wearing this exact watch, wrist turned to reveal the dial and crown. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/man/honey": "Photo of a man's wrist with honey-toned skin wearing this exact watch, wrist angled to showcase the dial. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/man/caramel": "Photo of a man's wrist with caramel-brown skin wearing this exact watch, wrist rotated to display the dial face. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",

  "watch/man/espresso": "Photo of a man's wrist with deep espresso-brown skin wearing this exact watch, wrist angled to reveal the dial over defined musculature. Natural everyday photo against a plain light background. The jewelry must be identical to reference.",
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
    await uploadToR2(buffer, key, 'image/jpeg')

    return key
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
        upscale_factor: 2,
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
  let imageBase64: string, jewelryType: JewelryType, quantity: number, displayType: 'woman' | 'man', skinTone: SkinTone, background: Background, nailStyle: NailStyle, noRef: boolean
  try {
    const body = await req.json()
    ;({ imageBase64, jewelryType } = body as { imageBase64: string; jewelryType: JewelryType })
    quantity    = Math.min(Math.max(Number(body.quantity) || 1, 1), 4)
    displayType = body.displayType  ?? 'woman'
    skinTone    = (body.skinTone    as SkinTone)   ?? 'sand'
    background  = (body.background  as Background) ?? 'pure_white'
    nailStyle   = (body.nailStyle   as NailStyle)  ?? 'natural'
    noRef       = Boolean(body.noRef)
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  // Max 10MB base64 (yaklaşık 7.5MB görsel)
  const MAX_BASE64_SIZE = 10 * 1024 * 1024
  if (imageBase64 && imageBase64.length > MAX_BASE64_SIZE) {
    return NextResponse.json({ error: 'Görsel çok büyük. Lütfen 7MB altında bir görsel yükleyin.' }, { status: 413 })
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

  const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

  // Her kombinasyon için mevcut görsel sayısı
  const REFERENCE_COUNTS: Record<string, number> = {
    'necklace/woman/ivory': 8,
    'necklace/woman/sand': 8,
    'necklace/woman/honey': 8,
    'necklace/woman/caramel': 8,
    'necklace/woman/espresso': 8,
    'necklace/man/ivory': 2,
    'necklace/man/sand': 2,
    'necklace/man/honey': 2,
    'necklace/man/caramel': 2,
    'necklace/man/espresso': 2,
    'earring/woman/ivory': 5,
    'earring/woman/sand': 5,
    'earring/woman/honey': 5,
    'earring/woman/caramel': 5,
    'earring/woman/espresso': 5,
    'earring/man/ivory': 1,
    'earring/man/sand': 1,
    'earring/man/honey': 1,
    'earring/man/caramel': 1,
    'earring/man/espresso': 1,
    'ring/man/ivory': 1,
    'ring/man/sand': 1,
    'ring/man/honey': 1,
    'ring/man/caramel': 1,
    'ring/man/espresso': 1,
    'ring/woman/ivory': 9,
    'ring/woman/sand': 5,
    'ring/woman/honey': 4,
    'ring/woman/caramel': 7,
    'ring/woman/espresso': 7,
    'watch/woman/ivory': 3,
    'watch/woman/sand': 3,
    'watch/woman/honey': 3,
    'watch/woman/caramel': 3,
    'watch/woman/espresso': 3,
    'watch/man/ivory': 5,
    'watch/man/sand': 5,
    'watch/man/honey': 5,
    'watch/man/caramel': 5,
    'watch/man/espresso': 5,
  }

  const countKey = `${jewelryType}/${displayType}/${skinTone}`
  const totalRefs = REFERENCE_COUNTS[countKey] ?? 1

  // Her varyant için farklı bir referans indeksi seç (mevcut sayıya kadar tekrarsız).
  const variantIndices: number[] = []
  if (quantity <= totalRefs) {
    const pool = Array.from({ length: totalRefs }, (_, i) => i + 1)
    for (let i = 0; i < quantity; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
      variantIndices.push(pool[i])
    }
  } else {
    for (let i = 0; i < quantity; i++) {
      variantIndices.push(Math.floor(Math.random() * totalRefs) + 1)
    }
  }

  async function uploadModelReference(index: number): Promise<string> {
    const key = `references/${jewelryType}/${displayType}/${skinTone}/${index}.png`
    try {
      const buf = await getFromR2(key)
      const blob = new Blob([buf], { type: 'image/png' })
      return await fal.storage.upload(blob)
    } catch (err) {
      console.error('R2 model fetch failed for key:', key, err)
      if (skinTone !== 'ivory') {
        const fallbackKey = jewelryType === 'ring' && displayType === 'woman'
          ? `references/ring/woman/ivory/1.png`
          : `references/${jewelryType}/${displayType}/ivory/1.png`
        const fbBuf = await getFromR2(fallbackKey)
        const fbBlob = new Blob([fbBuf], { type: 'image/png' })
        return await fal.storage.upload(fbBlob)
      }
      throw err
    }
  }

  const promptKey = `${jewelryType}/${displayType}/${skinTone}`
  const basePrompt = PROMPTS[promptKey] ?? `Photo of a ${displayType === 'woman' ? 'woman' : 'man'} wearing this exact ${jewelryType}, natural everyday photo, plain background. The jewelry must be identical to reference.`

  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
  const uploadedImageUrl = await fal.storage.upload(imageBlob)

  // noRef mod: her varyant için farklı bir poz seç (mevcut poz sayısına kadar tekrarsız).
  const variantPoses: string[] = []
  if (noRef) {
    const totalPoses = PERSON_POSES.length
    if (quantity <= totalPoses) {
      const pool = [...PERSON_POSES]
      for (let i = 0; i < quantity; i++) {
        const j = i + Math.floor(Math.random() * (pool.length - i))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
        variantPoses.push(pool[i])
      }
    } else {
      for (let i = 0; i < quantity; i++) variantPoses.push(pickRandom(PERSON_POSES))
    }
  }

  const results = await Promise.allSettled(
    variantIndices.map(async (refIndex, i) => {
      const composition = pickRandom(COMPOSITION_VARIATIONS)
      const lighting = pickRandom(LIGHTING_VARIATIONS)
      const mood = pickRandom(MOOD_VARIATIONS)
      const seed = Math.floor(Math.random() * 999999)
      const watchCritical = jewelryType === 'watch'
        ? 'CRITICAL: Reproduce the watch with 100% photographic accuracy. The dial face must display IDENTICAL hour/minute hands, indices, sub-dials, and any text exactly as in the reference — do NOT invent or hallucinate any watch brand name, numeral, or dial text. The case shape, crown, bezel, and lug design must be identical. The complete band/strap/bracelet must wrap fully around the wrist with all links, clasp, and material details faithfully reproduced. Do not simplify, crop, or omit any element.'
        : 'CRITICAL: The jewelry piece must be reproduced with 100% identical design, shape, and details to the reference — do not alter, simplify, or reinterpret it in any way.'

      if (noRef) {
        const skinDesc = SKIN_TONE_DESCRIPTIONS[skinTone] ?? SKIN_TONE_DESCRIPTIONS.sand
        const pose = variantPoses[i]
        const personBlock = displayType === 'woman'
          ? `A strikingly beautiful Turkish / Mediterranean European fashion model in her early twenties, professional model with high defined cheekbones, a slim elegant neck and long graceful collarbones, symmetrical refined features, flawless ${skinDesc}, subtle natural makeup, glossy healthy dark or chestnut hair neatly styled, slim toned model physique. ${pose}. Wearing a simple plain well-fitted top.`
          : `A strikingly handsome Turkish / Mediterranean European male fashion model in his early twenties, professional model with a sharply defined jawline, high cheekbones, symmetrical refined features, flawless ${skinDesc} and clear healthy complexion, glossy dark or chestnut hair neatly styled with a short natural haircut, athletic toned model physique with broad shoulders. ${pose}. Wearing a simple plain well-fitted top.`
        const variantPrompt = `${personBlock} ${basePrompt} ${watchCritical} ${IPHONE_REALISM} ${composition}. ${lighting}. ${mood}. Generation variant ${seed}.`
        return fal.subscribe('fal-ai/nano-banana-pro/edit', {
          input: {
            image_urls: [uploadedImageUrl],
            prompt: variantPrompt,
            aspect_ratio: "3:4",
          },
        })
      }

      const modelImageUrl = await uploadModelReference(refIndex)
      const variantPrompt = `${basePrompt} ${watchCritical} ${IPHONE_REALISM} ${composition}. ${lighting}. ${mood}. Generation variant ${seed}.`
      return fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: {
          image_urls: [modelImageUrl, uploadedImageUrl],
          prompt: variantPrompt,
          aspect_ratio: "3:4",
        },
      })
    })
  )

  const outputUrls: { url: string; id: string | null }[] = []

  await Promise.all(
    results.map(async (result) => {
      if (result.status === 'fulfilled') {
        const rawUrl = (result.value.data as NanoBananaResult).images[0].url
        const upscaledUrl = rawUrl
        const outputUrl = upscaledUrl

        const { data: genRecord } = await supabaseAdmin
          .from('generations')
          .insert({
            user_id: user.id,
            jewelry_type: jewelryType,
            status: 'done',
            credits_used: 1,
            output_image_url: outputUrl,
            is_saved: false,
          })
          .select('id')
          .single()

        outputUrls.push({ url: outputUrl, id: genRecord?.id ?? null })
      } else {
        console.error('Nano Banana error:', JSON.stringify(result.reason, null, 2))

        await supabaseAdmin
          .from('generations')
          .insert({
            user_id: user.id,
            jewelry_type: jewelryType,
            status: 'failed',
            credits_used: 0,
          })
      }
    })
  )

  if (outputUrls.length === 0) {
    return NextResponse.json({ error: 'Tüm üretimler başarısız' }, { status: 502 })
  }

  return NextResponse.json({ outputUrls, generationId: null })
}
