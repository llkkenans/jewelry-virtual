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
  "vertical 3:4 framing, tightly cropped on the neck, collarbones and upper chest, the jewellery large and centered, occupying a significant part of the frame",
  "close crop from the chin down to the mid-chest, the piece clearly readable and dominant in the composition",
  "upper chest and neck crop, frontal angle, the piece filling the middle of the frame, everything in sharp focus including the background wall",
  "the jewellery is the primary subject and fills a large portion of the frame, the face partially visible at the top",
  "cropped so the piece sits at the visual centre of the image, shoulders and neck framing it, minimal empty space",
  "close but not extreme crop, the jewellery occupying roughly half of the frame height, natural perspective",
]

const COMPOSITION_VARIATIONS_RING = [
  "vertical 3:4 framing, tight crop on the hand and fingers, the ring large and centered, occupying a significant part of the frame, face out of frame",
  "close crop on the hand raised near the collarbone, the ring dominant and clearly readable, face optional and partially visible",
  "hand-only close-up against a plain wall, fingers gracefully arranged, the ring at the visual centre of the frame",
  "the ring is the primary subject and fills a large portion of the frame, hand elegantly posed, minimal empty space",
  "cropped so the hand and ring sit at the visual centre, wrist and forearm framing it, no face in frame",
  "close but not extreme crop on the hand, the ring occupying roughly half of the frame height, natural perspective",
]

const COMPOSITION_VARIATIONS_WATCH = [
  "vertical 3:4 framing, tight crop on the wrist and forearm, the watch dial large and centered, occupying a significant part of the frame, face out of frame",
  "close crop on the wrist held up near the chest, the watch dominant and clearly readable",
  "wrist-only close-up against a plain wall, the watch at the visual centre of the frame, dial fully visible",
  "the watch is the primary subject and fills a large portion of the frame, hand relaxed, minimal empty space",
  "cropped so the wrist and watch sit at the visual centre, forearm framing it, no face in frame",
  "close but not extreme crop on the wrist, the watch occupying roughly half of the frame height, natural perspective",
]

const COMPOSITION_VARIATIONS_EARRING = [
  "vertical 3:4 framing, tightly cropped on the side of the face and ear, the earring large and centered, occupying a significant part of the frame",
  "close crop on the profile from cheekbone to jawline, the earring clearly readable and dominant in the composition",
  "side-of-face and neck crop, three-quarter angle, the earring filling the middle of the frame, everything in sharp focus including the background wall",
  "the earring is the primary subject and fills a large portion of the frame, only part of the face visible",
  "cropped so the ear and earring sit at the visual centre of the image, jawline and hair framing it, minimal empty space",
  "close but not extreme crop on the ear, the earring occupying roughly half of the frame height, natural perspective",
]

function pickComposition(type: JewelryType): string {
  switch (type) {
    case 'ring':    return pickRandom(COMPOSITION_VARIATIONS_RING)
    case 'watch':   return pickRandom(COMPOSITION_VARIATIONS_WATCH)
    case 'earring': return pickRandom(COMPOSITION_VARIATIONS_EARRING)
    default:        return pickRandom(COMPOSITION_VARIATIONS)
  }
}

const LIGHTING_VARIATIONS = [
  "bright soft daylight from a large window just off to one side, airy and clean, gentle falloff, well exposed",
  "large diffused key light from one side giving soft sculpted shadows, bright and clean",
  "clean frontal daylight from a wide window, bright and even, subtle shaping on the collarbones",
  "broad soft frontal light with a gentle falloff toward the edges of the frame, luminous and dimensional",
  "gentle late-afternoon daylight through a window, softly warm and inviting, still neutral skin tones, no orange cast",
  "mild warm indoor daylight in the late afternoon, cosy and alive, soft warmth on the skin without any heavy golden grading",
  "clear directional daylight from one side, casting a soft-edged but clearly defined shadow on the plain wall behind her, bright and sculpted",
  "single strong window light from the side, defined shadow shapes, luminous highlights on the cheekbones and collarbones, still neutral in colour",
]

const MOOD_VARIATIONS = [
  "relaxed confident expression, natural and self-assured",
  "clean commercial listing photo, honest and professionally shot",
  "composed and professional, relaxed natural expression",
  "simple catalogue photo, straightforward and elegant",
  "naturally posed, quietly confident, soft neutral expression",
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
  "both forearms crossed and resting in front of her, chin lowered onto her arms, looking straight into the camera with a calm intense gaze",
  "head tilted back, chin lifted high, eyes softly closed, neck elongated, shoulders relaxed",
  "cropped so the face is completely out of frame — only the neck, collarbones and upper chest are visible, shoulders square to the camera",
  "one hand raised to the side of her head, fingers resting in her hair, face turned toward the camera",
  "both hands holding the open collar of a shirt, chin lifted slightly, relaxed shoulders",
  "turned three-quarters away, looking back over her shoulder toward the camera",
  "one hand resting lightly on her collarbone, head slightly tilted, soft neutral expression",
  "seen from a low three-quarter angle, chin slightly raised, gaze directed just past the camera",
]

const COMMERCIAL_REALISM = "Professional commercial product photography for an e-commerce marketplace listing, shot on a modern full-frame camera with a standard prime lens. Crisp, well exposed and retail-ready. Moderate depth of field: the subject is tack sharp and the plain background stays softly readable — no extreme creamy bokeh, no heavy lens compression. Shaped directional light that gives real dimension to the neck, collarbones and jawline, with soft-edged shadows. Natural skin texture with visible pores and a clear healthy flawless complexion — luminous dewy sheen on the cheekbones and collarbones, never greasy, waxy or plastic. No beauty retouching, no airbrushing, no skin smoothing. Plain uncluttered wall or seamless backdrop. Neutral to very slightly warm white balance — no heavy golden or amber grading. Do NOT make it look like a casual phone snapshot, a selfie, or an amateur photo: no sensor noise, no harsh on-camera flash, no flat lifeless lighting. Equally, do NOT make it a fashion or perfume campaign: no rim light, no backlight, no coloured gel lighting, no gradient studio backdrop, no dramatic art direction. This is a clean, honest, professionally shot marketplace listing image."

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
      const composition = pickComposition(jewelryType)
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
          ? `A top international high-fashion runway model, Turkish / Mediterranean European, early twenties, magazine cover face — sculpted high cheekbones, sharp defined jawline, strong well-defined natural eyebrows, large expressive eyes, full lips, long slender elegant neck, graceful collarbones, perfectly symmetrical striking features, flawless clear ${skinDesc}, subtle natural makeup, glossy healthy dark or chestnut hair, tall slim runway model physique. She looks like the face of a national jewellery brand television campaign. ${pose}. Wearing a simple plain well-fitted top.`
          : `A top international high-fashion male model, Turkish / Mediterranean European, early twenties, magazine cover face — sharply chiselled jawline, sculpted high cheekbones, strong well-defined natural eyebrows, deep expressive eyes, perfectly symmetrical striking features, flawless clear ${skinDesc}, glossy healthy dark or chestnut hair with a short natural haircut, tall athletic runway model physique with broad shoulders. He looks like the face of a national jewellery brand television campaign. ${pose}. Wearing a simple plain well-fitted top.`
        const variantPrompt = `${personBlock} ${basePrompt} ${watchCritical} ${COMMERCIAL_REALISM} ${composition}. ${lighting}. ${mood}. Generation variant ${seed}.`
        return fal.subscribe('fal-ai/nano-banana-pro/edit', {
          input: {
            image_urls: [uploadedImageUrl],
            prompt: variantPrompt,
            aspect_ratio: "3:4",
          },
        })
      }

      const modelImageUrl = await uploadModelReference(refIndex)
      const variantPrompt = `${basePrompt} ${watchCritical} ${COMMERCIAL_REALISM} ${composition}. ${lighting}. ${mood}. Generation variant ${seed}.`
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
