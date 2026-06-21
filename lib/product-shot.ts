import { fal } from '@fal-ai/client'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'
import { SCENE_PROMPTS, INDUSTRY_SCENE_PROMPTS } from '@/lib/product-shot-prompts'

export { SCENE_PROMPTS }
export const INDUSTRY_SCENES = INDUSTRY_SCENE_PROMPTS

export const CREDITS_PER_SCENE = 1

export const SHADOW_MODIFIERS: Record<string, string> = {
  soft:     "Very subtle, barely visible contact shadow. Almost shadowless, flat lighting feel.",
  medium:   "Natural, realistic contact shadow directly beneath the product. Standard studio shadow.",
  dramatic: "Deep, elongated dramatic shadow with strong directional lighting. High contrast, editorial feel.",
}

export const VALID_SCENE_TYPES = Object.keys(SCENE_PROMPTS)
export const VALID_SHADOW_INTENSITIES = Object.keys(SHADOW_MODIFIERS)

type GptImageEditResult = {
  data?: { images?: Array<{ url?: string }> }
  images?: Array<{ url?: string }>
}

export type SceneOutcome =
  | { status: 'success'; r2Key: string; presignedUrl: string }
  | { status: 'failed'; error: string }

export async function uploadProductImage(imageBase64: string): Promise<string> {
  const buffer = Buffer.from(imageBase64, 'base64')
  const blob = new Blob([buffer], { type: 'image/jpeg' })
  return fal.storage.upload(blob)
}

export async function uploadImageFromUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const blob = new Blob([buffer], { type: contentType })
  return fal.storage.upload(blob)
}

const BRAND_SCENE_PROMPT =
  'Reproduce the exact same scene style, lighting, surface, and atmosphere from reference image (#2) but place this new product (#1) naturally into that scene. Keep identical color temperature, shadow direction, and background elements.'

export async function generateProductShot(
  falImageUrl: string,
  scene_type: string,
  shadow_intensity: string = 'medium',
  customPrompt?: string,
  referenceImageFalUrl?: string
): Promise<SceneOutcome> {
  const shadowModifier = SHADOW_MODIFIERS[shadow_intensity] ?? SHADOW_MODIFIERS['medium']
  const basePrompt = referenceImageFalUrl ? BRAND_SCENE_PROMPT : (customPrompt ?? SCENE_PROMPTS[scene_type])
  const prompt = `${basePrompt} ${shadowModifier}`
  const imageUrls = referenceImageFalUrl ? [falImageUrl, referenceImageFalUrl] : [falImageUrl]

  let rawOutputUrl: string
  try {
    const result = await fal.subscribe('openai/gpt-image-2/edit', {
      input: {
        prompt,
        image_urls: imageUrls,
        image_size: 'auto',
        quality: 'low',
        num_images: 1,
        output_format: 'png',
      },
    }) as GptImageEditResult
    const url = result.data?.images?.[0]?.url ?? result.images?.[0]?.url
    if (!url) throw new Error('gpt-image-2/edit: output URL bulunamadı')
    rawOutputUrl = url
  } catch (err) {
    return { status: 'failed', error: String(err) }
  }

  const r2Key = `outputs/product-shots/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
  let presignedUrl: string

  try {
    const res = await fetch(rawOutputUrl)
    if (!res.ok) throw new Error(`fal fetch failed: ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    await uploadToR2(buffer, r2Key, 'image/png')
    presignedUrl = await getPresignedUrl(r2Key, 3600)
  } catch (err) {
    console.error('R2 save failed, falling back to fal URL:', err)
    presignedUrl = rawOutputUrl
  }

  return { status: 'success', r2Key, presignedUrl: presignedUrl! }
}
