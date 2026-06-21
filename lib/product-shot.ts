import { fal } from '@fal-ai/client'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'

export const CREDITS_PER_SCENE = 1

export const SCENE_PROMPTS: Record<string, string> = {
  ecommerce:   "Transform this into a professional e-commerce product photograph. Place the product centered on a pure white seamless background. Add soft studio lighting from above-left with a fill light from the right creating gentle, natural shadows beneath the product. The product must look razor-sharp with accurate colors, textures, and reflective surfaces. Shoot style: 85mm lens, f/8, commercial catalog photography. No props, no distractions — clean, premium, ready for online store listing.",
  marble:      "Transform this into a luxury product photograph on a polished Calacatta marble surface with subtle grey veining. Soft directional window light from the left side creates elegant shadows and gentle highlights on the marble. The product sits naturally on the surface with realistic contact shadow and subtle reflection on the polished stone. Background softly blurs into a warm neutral tone. Shoot style: 50mm lens, f/2.8, shallow depth of field, Vogue still-life aesthetic.",
  lifestyle:   "Transform this into a warm lifestyle product photograph. Place the product naturally on a rustic wooden table in a cozy cafe setting. Include subtle background elements: a ceramic coffee cup slightly out of focus, warm ambient light streaming through a window, a soft knit textile draped nearby. The product is the hero but feels at home in the scene. Warm color temperature around 3500K. Shoot style: 35mm lens, f/2.0, editorial lifestyle photography with natural bokeh.",
  nature:      "Transform this into an organic outdoor product photograph. Place the product on a natural stone or moss-covered surface in a lush garden setting. Soft dappled sunlight filtering through leaves creates natural light patterns. Background shows soft-focus greenery and wildflowers. Morning golden hour lighting with gentle lens flare. The product feels grounded in nature with realistic shadows on the organic surface. Shoot style: 50mm lens, f/2.8, organic beauty brand aesthetic.",
  minimal:     "Transform this into a minimalist Scandinavian-style product photograph. Place the product on a warm sand-beige linen surface. Ultra-soft diffused lighting from a large overhead softbox creates almost shadowless illumination with just a hint of depth. Background is a smooth gradient from warm beige to soft cream. The entire image feels calm, premium, and intentional. Shoot style: 90mm macro lens, f/5.6, Kinfolk magazine aesthetic, desaturated warm tones.",
  dark_luxury: "Transform this into a dramatic dark luxury product photograph. Place the product on a matte black surface with subtle texture. Single focused spotlight from above-right creates a dramatic rim light on the product edges while the face stays softly lit. Deep black background fading to pure darkness. Subtle golden accent light kissing the product from behind. Realistic specular highlights and reflections on the dark surface. Shoot style: 100mm macro lens, f/4, high-end watch/jewelry brand campaign aesthetic.",
}

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

export async function generateProductShot(
  falImageUrl: string,
  scene_type: string,
  shadow_intensity: string = 'medium'
): Promise<SceneOutcome> {
  const shadowModifier = SHADOW_MODIFIERS[shadow_intensity] ?? SHADOW_MODIFIERS['medium']
  const prompt = `${SCENE_PROMPTS[scene_type]} ${shadowModifier}`

  let rawOutputUrl: string
  try {
    const result = await fal.subscribe('openai/gpt-image-2/edit', {
      input: {
        prompt,
        image_urls: [falImageUrl],
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
