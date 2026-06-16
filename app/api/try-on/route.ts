import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getFromR2 } from '@/lib/r2'

type JewelryType = 'ring' | 'necklace' | 'earring' | 'watch'
type SkinTone    = 'ivory' | 'sand' | 'honey' | 'caramel' | 'espresso'
type Background  = 'pure_white' | 'soft_grey' | 'golden_hour' | 'marble_luxe' | 'noir'
type NailStyle   = 'natural' | 'french' | 'red' | 'dark'
type PromptKey   = `${JewelryType}/${string}/${SkinTone}`

const VALID_JEWELRY_TYPES: JewelryType[] = ['ring', 'necklace', 'earring', 'watch']

const COMPOSITION_VARIATIONS = [
  "Head turned in a soft three-quarter profile to the left.",
  "Head angled in a three-quarter profile to the right.",
  "Direct frontal pose with relaxed neutral expression.",
  "Slight chin tilt upward, elegant elongated neckline.",
  "Subtle downward gaze, contemplative editorial mood.",
  "Profile view with shoulder slightly forward, dynamic composition.",
  "Cropped editorial framing focused on the décolletage.",
  "Close-up macro framing with shallow depth of field.",
]

const LIGHTING_VARIATIONS = [
  "Soft morning light from a north-facing window, gentle diffused shadows.",
  "Golden hour warm directional sunlight from the side.",
  "High-key studio strobe with large softbox overhead.",
  "Low-key dramatic side lighting with rich shadow contrast.",
  "Beauty dish frontal lighting with subtle fill from below.",
  "Backlit rim light separating subject from a darker background.",
]

const MOOD_VARIATIONS = [
  "Editorial high-fashion magazine aesthetic.",
  "Minimalist Scandinavian campaign mood.",
  "Romantic engagement-photography softness.",
  "Bold luxury brand campaign energy.",
  "Quiet contemplative artistic portrait.",
  "Clean commercial e-commerce catalog style.",
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const PROMPTS: Record<string, string> = {
  "ring/woman/ivory": "Place the ring precisely on the ring finger of an elegant feminine hand with porcelain ivory skin, fingers gracefully relaxed and slightly curved. Capture in macro studio detail with soft diffused key light from the upper left and a gentle fill reflector eliminating harsh shadows. The skin shows fine natural texture, subtle translucency, and a delicate matte finish. Background is a seamless soft pearl-white gradient with creamy bokeh. Professional high-end jewelry photography, crisp focus on the band and stone, realistic metal reflections. The jewelry must be identical to reference. Hand rests on brushed marble surface with a faint dewy sheen catching the light.",

  "ring/woman/sand": "Position the ring on the ring finger of a refined feminine hand with warm light sand-toned skin, fingers elegantly extended with a natural soft arch. Macro studio capture using a large softbox overhead and a warm bounce card, producing smooth gradient highlights along each finger. Skin displays gentle natural texture, a healthy radiant glow, and realistic pores. Background is a warm ivory-to-taupe gradient with creamy out-of-focus depth. Editorial luxury jewelry photography with sharp focus on the setting, accurate metallic glints, and faithful gemstone color. The jewelry must be identical to reference. Soft golden rim light traces the knuckles and a single dried pampas stem blurs behind.",

  "ring/woman/honey": "Set the ring on the ring finger of a graceful feminine hand with golden honey-toned skin, fingers poised in a soft sculptural curl. Shoot in macro with directional studio lighting from the right, a warm key and cool fill creating dimensional contrast across the skin. Texture reveals luminous warmth, smooth tone transitions, and lifelike surface detail. Background is a honeyed amber gradient melting into soft bokeh. Premium jewelry catalog photography, razor-sharp on the band, true metal reflections and clean stone clarity. The jewelry must be identical to reference. Hand drapes over a folded silk ribbon in muted champagne, fabric ripples softly defocused.",

  "ring/woman/caramel": "Place the ring on the ring finger of an elegant feminine hand with rich caramel-brown skin, fingers gently fanned and relaxed. Capture macro detail under a soft overhead beauty dish with a subtle warm gel and reflective fill, sculpting glossy highlights on the knuckles. Skin shows deep warm undertones, natural sheen, and fine realistic texture. Background is a deep mocha-to-tan gradient with velvety bokeh. High-fashion jewelry photography, precise focus on the stone facets and band engraving, accurate metallic luster. The jewelry must be identical to reference. Fingertips rest lightly against textured raw linen, threads softly blurred in the lower frame.",

  "ring/woman/espresso": "Position the ring on the ring finger of a striking feminine hand with deep espresso-brown skin, fingers arranged in a poised confident gesture. Macro studio shot with a crisp key light from the upper left and a luminous fill, producing radiant specular highlights against the rich skin. Texture shows smooth depth, healthy glow, and authentic detail. Background is a charcoal-to-cocoa gradient with elegant soft bokeh. Luxury editorial jewelry photography, ultra-sharp on the setting and band, true reflective metal and brilliant gemstone sparkle. The jewelry must be identical to reference. A single white orchid petal lies blurred beside the wrist, catching a faint cool glow.",

  "ring/man/ivory": "Place the ring on the ring finger of a strong masculine hand with fair ivory skin, fingers firm and naturally squared with defined knuckles. Capture in macro under crisp directional studio light from the upper right with a clean fill, sculpting subtle shadows along the tendons. Skin shows fine texture, light hair detail, and matte realistic surface. Background is a cool slate-grey gradient with restrained bokeh. Masculine luxury jewelry photography, sharp focus on the band, accurate brushed-metal reflections. The jewelry must be identical to reference. Hand rests on a dark walnut surface with a faint matte sheen, edge softly defocused.",

  "ring/man/sand": "Position the ring on the ring finger of a confident masculine hand with warm sand-toned skin, fingers relaxed yet defined with visible tendon structure. Macro studio capture using a softbox key from the left and a neutral bounce, producing smooth highlights across the broad knuckles. Skin displays natural warmth, fine pores, and subtle hair detail. Background is a warm stone-grey gradient fading into soft depth. Premium men's jewelry photography, crisp on the band edges, realistic metallic glints. The jewelry must be identical to reference. Hand rests near a coiled leather strap, the texture softly blurred in warm amber undertones.",

  "ring/man/honey": "Set the ring on the ring finger of a robust masculine hand with golden honey-toned skin, fingers naturally curled with strong definition. Shoot macro with directional studio lighting from the right, a warm key against a cool fill building dimensional shadows on the skin. Texture reveals healthy warmth, lifelike pores, and faint hair. Background is a warm bronze-grey gradient with subtle bokeh. High-end men's jewelry editorial, sharp focus on the band detailing, true metal luster. The jewelry must be identical to reference. Fingers rest against a folded charcoal wool fabric, weave defocused softly in the background.",

  "ring/man/caramel": "Place the ring on the ring finger of a powerful masculine hand with rich caramel-brown skin, fingers squared and firmly relaxed. Macro studio shot with a beauty dish overhead and a warm reflective fill, carving glossy highlights along the knuckles and tendons. Skin shows deep warm undertones, natural sheen, and realistic texture with fine hair. Background is a deep umber-to-grey gradient with velvety bokeh. Luxury men's jewelry photography, precise focus on the band engraving, accurate reflective metal. The jewelry must be identical to reference. Hand rests on cool dark slate stone, a thin shaft of light cutting diagonally through the blur.",

  "ring/man/espresso": "Position the ring on the ring finger of a striking masculine hand with deep espresso-brown skin, fingers arranged in a strong steady pose with defined musculature. Macro studio capture with a sharp key light from the upper left and a bright fill, producing radiant specular highlights on the rich skin. Texture shows smooth depth, healthy glow, and fine authentic detail. Background is a near-black charcoal gradient with elegant soft bokeh. Premium editorial men's jewelry photography, ultra-sharp on the band, true metallic reflections. The jewelry must be identical to reference. A burnished brass curve gleams faintly out of focus beside the wrist.",

  "necklace/woman/ivory": "Drape the necklace gracefully across the collarbone and upper décolletage of an elegant feminine model with porcelain ivory skin, the pendant resting centered just below the throat. Capture in studio with soft diffused frontal light and a gentle side fill, producing smooth luminous skin tones and delicate shadows along the clavicle. Skin shows fine translucent texture and a natural matte glow. Background is a seamless soft pearl-grey gradient with creamy bokeh. High-end jewelry photography, sharp focus on the pendant and chain links, accurate metallic shimmer. The jewelry must be identical to reference. A loose strand of hair falls softly defocused along the neckline.",

  "necklace/woman/sand": "Lay the necklace elegantly along the collarbone and chest of a refined feminine model with warm sand-toned skin, the pendant centered on the sternum. Studio capture with a large softbox key and a warm bounce, sculpting gentle highlights across the neck and shoulders. Skin displays a radiant healthy glow, fine texture, and smooth tonal transitions. Background is a warm ivory-to-beige gradient with soft depth. Editorial luxury jewelry photography, crisp on the chain and pendant detail, true metal reflections. The jewelry must be identical to reference. Bare shoulder edge catches a soft golden rim light, fabric strap blurred at the frame's edge.",

  "necklace/woman/honey": "Position the necklace across the collarbone and upper chest of a graceful feminine model with golden honey-toned skin, pendant resting warm against the décolletage. Shoot in studio with directional key light from the right and a cool fill, building dimensional highlights along the clavicle. Skin reveals luminous warmth, smooth detail, and lifelike texture. Background is a honeyed amber gradient with soft bokeh. Premium jewelry catalog photography, razor-sharp on the pendant facets and chain, accurate metallic luster. The jewelry must be identical to reference. A sheer champagne fabric drapes softly off one shoulder, blurred in the lower frame.",

  "necklace/woman/caramel": "Drape the necklace along the collarbone and chest of an elegant feminine model with rich caramel-brown skin, the pendant centered and glinting. Studio capture under a soft beauty dish with a warm reflective fill, producing glossy highlights across the neck and shoulders. Skin shows deep warm undertones, natural sheen, and fine realistic texture. Background is a deep mocha-to-tan gradient with velvety bokeh. High-fashion jewelry photography, precise focus on the pendant and chain links, true reflective metal. The jewelry must be identical to reference. A subtle catchlight traces the jawline above while a dark satin edge blurs softly at the shoulder.",

  "necklace/woman/espresso": "Lay the necklace across the collarbone and upper décolletage of a striking feminine model with deep espresso-brown skin, pendant resting elegantly below the throat. Macro-detail studio shot with a crisp key light from the upper left and a luminous fill, creating radiant specular highlights on the rich skin. Texture shows smooth depth, healthy glow, and authentic detail. Background is a charcoal-to-cocoa gradient with elegant bokeh. Luxury editorial jewelry photography, ultra-sharp on the chain and pendant, brilliant metallic sparkle. The jewelry must be identical to reference. A single soft beam of warm light grazes the collarbone, deepening the contour shadows.",

  "necklace/man/ivory": "Place the necklace around the neck of a strong masculine model with fair ivory skin, the pendant resting at the base of the throat over a defined chest. Studio capture with crisp directional light from the upper right and a clean fill, sculpting subtle shadows along the neck tendons and collarbone. Skin shows fine matte texture and faint detail. Background is a cool slate-grey gradient with restrained bokeh. Masculine luxury jewelry photography, sharp focus on the chain and pendant, accurate brushed-metal reflections. The jewelry must be identical to reference. The open collar of a dark shirt frames the neckline, fabric softly defocused.",

  "necklace/man/sand": "Position the necklace at the neck of a confident masculine model with warm sand-toned skin, pendant centered over a broad defined chest. Studio shot using a softbox key from the left and a neutral bounce, producing smooth highlights across the collarbone and shoulders. Skin displays natural warmth, fine texture, and subtle definition. Background is a warm stone-grey gradient fading into soft depth. Premium men's jewelry photography, crisp on the chain links, realistic metallic glints. The jewelry must be identical to reference. A loosened linen collar blurs at the edges while warm light grazes the shoulder line.",

  "necklace/man/honey": "Drape the necklace across the neck and upper chest of a robust masculine model with golden honey-toned skin, the pendant resting against firm musculature. Shoot in studio with directional key light from the right and a cool fill, building dimensional shadows along the clavicle. Skin reveals healthy warmth, lifelike texture, and faint detail. Background is a warm bronze-grey gradient with subtle bokeh. High-end men's jewelry editorial, sharp focus on the pendant and chain, true metal luster. The jewelry must be identical to reference. A dark open jacket lapel frames one side, softly blurred in shadow.",

  "necklace/man/caramel": "Place the necklace around the neck of a powerful masculine model with rich caramel-brown skin, pendant centered over a strong sculpted chest. Studio capture with a beauty dish overhead and a warm reflective fill, carving glossy highlights along the collarbone and neck. Skin shows deep warm undertones, natural sheen, and realistic texture. Background is a deep umber-to-grey gradient with velvety bokeh. Luxury men's jewelry photography, precise focus on the chain detail, accurate reflective metal. The jewelry must be identical to reference. A diagonal shaft of cool light cuts across the upper chest while the background falls into soft darkness.",

  "necklace/man/espresso": "Position the necklace at the throat and chest of a striking masculine model with deep espresso-brown skin, the pendant resting on defined musculature. Studio shot with a sharp key light from the upper left and a bright fill, producing radiant specular highlights on the rich skin. Texture shows smooth depth, healthy glow, and fine authentic detail. Background is a near-black charcoal gradient with elegant bokeh. Premium editorial men's jewelry photography, ultra-sharp on the chain and pendant, true metallic reflections. The jewelry must be identical to reference. A faint warm rim light outlines the shoulder, separating it cleanly from the dark backdrop.",

  "earring/woman/ivory": "Place the earring on the earlobe of an elegant feminine model with porcelain ivory skin, head turned in a graceful three-quarter profile revealing the ear clearly. Macro studio capture with soft diffused light from the front-left and a gentle fill, producing luminous skin tones and a delicate shadow behind the jaw. Skin shows fine translucent texture and a natural matte glow. Background is a seamless soft pearl-grey gradient with creamy bokeh. High-end jewelry photography, sharp focus on the earring detail, accurate metallic shimmer. The jewelry must be identical to reference. Wisps of hair tucked behind the ear blur softly, framing the lobe.",

  "earring/woman/sand": "Position the earring on the earlobe of a refined feminine model with warm sand-toned skin, profile angled to display the ear and elegant jawline. Macro studio shot with a softbox key and a warm bounce, sculpting smooth highlights along the cheek and neck. Skin displays a radiant healthy glow, fine texture, and smooth transitions. Background is a warm ivory-to-beige gradient with soft depth. Editorial luxury jewelry photography, crisp on the earring facets, true metal reflections. The jewelry must be identical to reference. A loose curl falls beside the cheek, defocused, catching a faint golden glow.",

  "earring/woman/honey": "Set the earring on the earlobe of a graceful feminine model with golden honey-toned skin, head in a soft three-quarter turn revealing the ear. Macro studio capture with directional key light from the right and a cool fill, building dimensional highlights along the jaw. Skin reveals luminous warmth, smooth detail, and lifelike texture. Background is a honeyed amber gradient with soft bokeh. Premium jewelry catalog photography, razor-sharp on the earring and any dangling element, accurate metallic luster. The jewelry must be identical to reference. Sleek hair swept back exposes the neck, a single strand blurred across the frame.",

  "earring/woman/caramel": "Place the earring on the earlobe of an elegant feminine model with rich caramel-brown skin, profile turned to showcase the ear and graceful neckline. Macro studio shot under a soft beauty dish with a warm reflective fill, producing glossy highlights across the cheek and lobe. Skin shows deep warm undertones, natural sheen, and fine realistic texture. Background is a deep mocha-to-tan gradient with velvety bokeh. High-fashion jewelry photography, precise focus on the earring detail, true reflective metal. The jewelry must be identical to reference. A subtle catchlight glows on the earlobe while a dark hair edge frames the jaw softly.",

  "earring/woman/espresso": "Position the earring on the earlobe of a striking feminine model with deep espresso-brown skin, head angled in an elegant three-quarter profile. Macro studio capture with a crisp key light from the upper left and a luminous fill, creating radiant specular highlights on the rich skin and lobe. Texture shows smooth depth, healthy glow, and authentic detail. Background is a charcoal-to-cocoa gradient with elegant bokeh. Luxury editorial jewelry photography, ultra-sharp on the earring, brilliant metallic sparkle. The jewelry must be identical to reference. A warm beam grazes the cheekbone, deepening the contour shadow along the neck.",

  "earring/man/ivory": "Place the earring on the earlobe of a strong masculine model with fair ivory skin, head in a defined three-quarter profile revealing the ear and sharp jawline. Macro studio capture with crisp directional light from the upper right and a clean fill, sculpting subtle shadows along the jaw and neck. Skin shows fine matte texture and faint detail. Background is a cool slate-grey gradient with restrained bokeh. Masculine luxury jewelry photography, sharp focus on the earring stud, accurate brushed-metal reflections. The jewelry must be identical to reference. Short cropped hair frames the temple, a dark collar edge blurred below the jaw.",

  "earring/man/sand": "Position the earring on the earlobe of a confident masculine model with warm sand-toned skin, profile angled to display the ear and strong jaw. Macro studio shot using a softbox key from the left and a neutral bounce, producing smooth highlights along the cheek and neck. Skin displays natural warmth, fine texture, and subtle definition. Background is a warm stone-grey gradient fading into soft depth. Premium men's jewelry photography, crisp on the earring detail, realistic metallic glints. The jewelry must be identical to reference. Faint stubble texture catches the light along the jawline, the shoulder blurred in warm shadow.",

  "earring/man/honey": "Set the earring on the earlobe of a robust masculine model with golden honey-toned skin, head in a soft three-quarter turn revealing the ear. Macro studio capture with directional key light from the right and a cool fill, building dimensional shadows along the jaw. Skin reveals healthy warmth, lifelike texture, and faint detail. Background is a warm bronze-grey gradient with subtle bokeh. High-end men's jewelry editorial, sharp focus on the earring stud, true metal luster. The jewelry must be identical to reference. A dark jacket collar rises into the lower frame, softly defocused against the warm tones.",

  "earring/man/caramel": "Place the earring on the earlobe of a powerful masculine model with rich caramel-brown skin, profile turned to showcase the ear and sculpted jawline. Macro studio shot under a beauty dish with a warm reflective fill, carving glossy highlights across the cheek and lobe. Skin shows deep warm undertones, natural sheen, and realistic texture. Background is a deep umber-to-grey gradient with velvety bokeh. Luxury men's jewelry photography, precise focus on the earring detail, accurate reflective metal. The jewelry must be identical to reference. A diagonal shaft of cool light skims the jaw while the background recedes into soft darkness.",

  "earring/man/espresso": "Position the earring on the earlobe of a striking masculine model with deep espresso-brown skin, head angled in a strong three-quarter profile. Macro studio capture with a sharp key light from the upper left and a bright fill, producing radiant specular highlights on the rich skin and lobe. Texture shows smooth depth, healthy glow, and fine authentic detail. Background is a near-black charcoal gradient with elegant bokeh. Premium editorial men's jewelry photography, ultra-sharp on the earring, true metallic reflections. The jewelry must be identical to reference. A faint warm rim light traces the ear and temple, cleanly separating the head from the dark backdrop.",

  "watch/woman/ivory": "Fasten the watch on the wrist of an elegant feminine hand with porcelain ivory skin, wrist gently angled to display the dial face clearly. Macro studio capture with soft diffused light from the upper left and a gentle fill, producing luminous skin tones and crisp reflections on the watch glass. Skin shows fine translucent texture and a natural matte glow. Background is a seamless soft pearl-grey gradient with creamy bokeh. High-end jewelry photography, sharp focus on the dial and bracelet links, accurate metallic shimmer. The jewelry must be identical to reference. Fingers curl softly toward a folded silk scarf blurred in the lower frame.",

  "watch/woman/sand": "Place the watch on the wrist of a refined feminine hand with warm sand-toned skin, wrist turned to reveal the dial and crown. Macro studio shot with a softbox key and a warm bounce, sculpting smooth highlights along the forearm and band. Skin displays a radiant healthy glow, fine texture, and smooth transitions. Background is a warm ivory-to-beige gradient with soft depth. Editorial luxury jewelry photography, crisp on the watch face and links, true metal reflections. The jewelry must be identical to reference. The wrist rests against a pale suede cushion, texture softly defocused with a golden rim of light.",

  "watch/woman/honey": "Fasten the watch on the wrist of a graceful feminine hand with golden honey-toned skin, wrist angled elegantly to showcase the dial. Macro studio capture with directional key light from the right and a cool fill, building dimensional highlights on the band and skin. Texture reveals luminous warmth, smooth detail, and lifelike surface. Background is a honeyed amber gradient with soft bokeh. Premium jewelry catalog photography, razor-sharp on the dial markers and bracelet, accurate metallic luster. The jewelry must be identical to reference. Fingertips graze a sheer champagne ribbon, its folds blurred warmly across the frame.",

  "watch/woman/caramel": "Place the watch on the wrist of an elegant feminine hand with rich caramel-brown skin, wrist gently rotated to display the dial face. Macro studio shot under a soft beauty dish with a warm reflective fill, producing glossy highlights along the band and knuckles. Skin shows deep warm undertones, natural sheen, and fine realistic texture. Background is a deep mocha-to-tan gradient with velvety bokeh. High-fashion jewelry photography, precise focus on the watch glass and links, true reflective metal. The jewelry must be identical to reference. The hand rests on cool dark marble, a thin highlight tracing the wrist bone.",

  "watch/woman/espresso": "Fasten the watch on the wrist of a striking feminine hand with deep espresso-brown skin, wrist angled to reveal the dial clearly. Macro studio capture with a crisp key light from the upper left and a luminous fill, creating radiant specular highlights on the rich skin and watch glass. Texture shows smooth depth, healthy glow, and authentic detail. Background is a charcoal-to-cocoa gradient with elegant bokeh. Luxury editorial jewelry photography, ultra-sharp on the dial and bracelet, brilliant metallic sparkle. The jewelry must be identical to reference. A single white orchid bloom blurs beside the wrist, catching a faint cool glow.",

  "watch/man/ivory": "Fasten the watch on the wrist of a strong masculine hand with fair ivory skin, wrist angled to display the dial face over a defined forearm. Macro studio capture with crisp directional light from the upper right and a clean fill, sculpting subtle shadows along the tendons and reflections on the glass. Skin shows fine matte texture, light hair detail, and realistic surface. Background is a cool slate-grey gradient with restrained bokeh. Masculine luxury jewelry photography, sharp focus on the dial and bracelet, accurate brushed-metal reflections. The jewelry must be identical to reference. The wrist rests on dark walnut, a shirt cuff blurred at the frame's edge.",

  "watch/man/sand": "Place the watch on the wrist of a confident masculine hand with warm sand-toned skin, wrist turned to reveal the dial and crown over a broad forearm. Macro studio shot using a softbox key from the left and a neutral bounce, producing smooth highlights across the band and tendons. Skin displays natural warmth, fine texture, and subtle hair detail. Background is a warm stone-grey gradient fading into soft depth. Premium men's jewelry photography, crisp on the dial markers, realistic metallic glints. The jewelry must be identical to reference. A rolled leather cuff blurs beside the wrist in warm amber undertones.",

  "watch/man/honey": "Fasten the watch on the wrist of a robust masculine hand with golden honey-toned skin, wrist angled to showcase the dial over firm musculature. Macro studio capture with directional key light from the right and a cool fill, building dimensional shadows along the band and forearm. Skin reveals healthy warmth, lifelike texture, and faint hair. Background is a warm bronze-grey gradient with subtle bokeh. High-end men's jewelry editorial, sharp focus on the watch face and links, true metal luster. The jewelry must be identical to reference. The forearm rests on folded charcoal wool, the weave softly defocused behind.",

  "watch/man/caramel": "Place the watch on the wrist of a powerful masculine hand with rich caramel-brown skin, wrist rotated to display the dial face clearly. Macro studio shot under a beauty dish with a warm reflective fill, carving glossy highlights along the band and tendons. Skin shows deep warm undertones, natural sheen, and realistic texture with fine hair. Background is a deep umber-to-grey gradient with velvety bokeh. Luxury men's jewelry photography, precise focus on the dial and bracelet, accurate reflective metal. The jewelry must be identical to reference. A diagonal shaft of cool light cuts across the forearm against dark slate stone.",

  "watch/man/espresso": "Fasten the watch on the wrist of a striking masculine hand with deep espresso-brown skin, wrist angled to reveal the dial over defined musculature. Macro studio capture with a sharp key light from the upper left and a bright fill, producing radiant specular highlights on the rich skin and watch glass. Texture shows smooth depth, healthy glow, and fine authentic detail. Background is a near-black charcoal gradient with elegant bokeh. Premium editorial men's jewelry photography, ultra-sharp on the dial and bracelet, true metallic reflections. The jewelry must be identical to reference. A burnished brass bar gleams faintly out of focus beside the wrist.",
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
  let imageBase64: string, jewelryType: JewelryType, quantity: number, displayType: 'woman' | 'man', skinTone: SkinTone, background: Background, nailStyle: NailStyle
  try {
    const body = await req.json()
    ;({ imageBase64, jewelryType } = body as { imageBase64: string; jewelryType: JewelryType })
    quantity    = Math.min(Math.max(Number(body.quantity) || 1, 1), 4)
    displayType = body.displayType  ?? 'woman'
    skinTone    = (body.skinTone    as SkinTone)   ?? 'sand'
    background  = (body.background  as Background) ?? 'pure_white'
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
  const r2Key = `references/${jewelryType}/${displayType}/${skinTone}/1.png`
  console.log('R2 key:', r2Key)
  try {
    const modelImageBuffer = await getFromR2(r2Key)
    const modelBlob = new Blob([modelImageBuffer], { type: 'image/png' })
    modelImageUrl = await fal.storage.upload(modelBlob)
    console.log('Model fal URL:', modelImageUrl)
  } catch (err) {
    console.error('R2 model fetch failed:', err)
    return NextResponse.json({ error: 'Referans görsel yüklenemedi' }, { status: 500 })
  }

  const promptKey = `${jewelryType}/${displayType}/${skinTone}`
  const basePrompt = PROMPTS[promptKey] ?? `Professional jewelry photography, ${displayType === 'woman' ? 'elegant woman' : 'handsome man'} wearing this exact ${jewelryType}, ultra realistic, 8K, the jewelry must be identical to reference.`

  console.log('── try-on params ──')
  console.log('displayType:', displayType, '| jewelryType:', jewelryType)
  console.log('skinTone:', skinTone, '| nailStyle:', nailStyle, '| background:', background)
  console.log('modelImageUrl:', modelImageUrl)
  console.log('promptKey:', promptKey)
  console.log('basePrompt:', basePrompt.slice(0, 80) + '...')

  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' })
  const uploadedImageUrl = await fal.storage.upload(imageBlob)
  console.log('Takı URL:', uploadedImageUrl)

  const results = await Promise.allSettled(
    Array.from({ length: quantity }, (_, i) => {
      const composition = pickRandom(COMPOSITION_VARIATIONS)
      const lighting = pickRandom(LIGHTING_VARIATIONS)
      const mood = pickRandom(MOOD_VARIATIONS)
      const seed = Math.floor(Math.random() * 999999)
      const variantPrompt = `${basePrompt} ${composition} ${lighting} ${mood} Generation variant ${seed}.`
      console.log(`Variant ${i + 1}:`, composition.slice(0, 40), '|', lighting.slice(0, 40), '|', 'seed:', seed)
      return fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: {
          image_urls: [modelImageUrl, uploadedImageUrl],
          prompt: variantPrompt,
        },
      })
    })
  )

  const outputUrls: string[] = []

  await Promise.all(
    results.map(async (result) => {
      if (result.status === 'fulfilled') {
        const rawUrl = (result.value.data as NanoBananaResult).images[0].url
        const upscaledUrl = await upscaleImage(rawUrl)
        const outputUrl = upscaledUrl
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
