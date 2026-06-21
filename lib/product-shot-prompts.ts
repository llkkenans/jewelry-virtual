export const SCENE_PROMPTS: Record<string, string> = {
  ecommerce:   "Transform this into a professional e-commerce product photograph. Place the product centered on a pure white seamless background. Add soft studio lighting from above-left with a fill light from the right creating gentle, natural shadows beneath the product. The product must look razor-sharp with accurate colors, textures, and reflective surfaces. Shoot style: 85mm lens, f/8, commercial catalog photography. No props, no distractions — clean, premium, ready for online store listing.",
  marble:      "Transform this into a luxury product photograph on a polished Calacatta marble surface with subtle grey veining. Soft directional window light from the left side creates elegant shadows and gentle highlights on the marble. The product sits naturally on the surface with realistic contact shadow and subtle reflection on the polished stone. Background softly blurs into a warm neutral tone. Shoot style: 50mm lens, f/2.8, shallow depth of field, Vogue still-life aesthetic.",
  lifestyle:   "Transform this into a warm lifestyle product photograph. Place the product naturally on a rustic wooden table in a cozy cafe setting. Include subtle background elements: a ceramic coffee cup slightly out of focus, warm ambient light streaming through a window, a soft knit textile draped nearby. The product is the hero but feels at home in the scene. Warm color temperature around 3500K. Shoot style: 35mm lens, f/2.0, editorial lifestyle photography with natural bokeh.",
  nature:      "Transform this into an organic outdoor product photograph. Place the product on a natural stone or moss-covered surface in a lush garden setting. Soft dappled sunlight filtering through leaves creates natural light patterns. Background shows soft-focus greenery and wildflowers. Morning golden hour lighting with gentle lens flare. The product feels grounded in nature with realistic shadows on the organic surface. Shoot style: 50mm lens, f/2.8, organic beauty brand aesthetic.",
  minimal:     "Transform this into a minimalist Scandinavian-style product photograph. Place the product on a warm sand-beige linen surface. Ultra-soft diffused lighting from a large overhead softbox creates almost shadowless illumination with just a hint of depth. Background is a smooth gradient from warm beige to soft cream. The entire image feels calm, premium, and intentional. Shoot style: 90mm macro lens, f/5.6, Kinfolk magazine aesthetic, desaturated warm tones.",
  dark_luxury: "Transform this into a dramatic dark luxury product photograph. Place the product on a matte black surface with subtle texture. Single focused spotlight from above-right creates a dramatic rim light on the product edges while the face stays softly lit. Deep black background fading to pure darkness. Subtle golden accent light kissing the product from behind. Realistic specular highlights and reflections on the dark surface. Shoot style: 100mm macro lens, f/4, high-end watch/jewelry brand campaign aesthetic.",
}

export const INDUSTRY_SCENE_PROMPTS: Record<string, Record<string, string>> = {
  kitchen: {
    wooden_counter: "Place this product on a warm oak kitchen countertop next to a cutting board and fresh herbs. Morning sunlight streams through a window, casting soft shadows. A copper kettle sits slightly out of focus in the background. Professional food & lifestyle product photography, 50mm lens, f/2.8, shallow depth of field.",
    modern_kitchen: "Place this product on a sleek white quartz kitchen island in a modern minimalist kitchen. Stainless steel appliances and pendant lights softly blurred in the background. Clean, bright, editorial kitchen photography, 35mm lens, f/4, natural daylight.",
    rustic_shelf: "Place this product on a rustic wooden floating shelf against a white shiplap wall. A small potted succulent and a ceramic mug nearby, slightly out of focus. Warm farmhouse aesthetic, lifestyle product photography, 85mm lens, f/2.0.",
    breakfast_table: "Place this product on a marble breakfast table with a croissant on a plate and a latte in a ceramic cup nearby, all slightly out of focus. Soft golden morning light from the left. Cozy lifestyle editorial photography, 50mm lens, f/2.8.",
  },
  cosmetics: {
    spa_bathroom: "Place this product on a polished white marble bathroom vanity surrounded by soft white towels and eucalyptus sprigs. Warm diffused lighting from above. Luxury spa aesthetic, beauty product photography, 90mm macro lens, f/4.",
    water_droplets: "Place this product on a wet glass surface with fresh water droplets scattered around it. Cool blue-white studio lighting with subtle reflections. Clean, hydrating beauty aesthetic. Skincare campaign photography, 100mm macro lens, f/5.6.",
    rose_petals: "Place this product on a soft pink satin fabric surface with scattered dried rose petals. Romantic soft-focus background in blush tones. Feminine luxury beauty photography, 85mm lens, f/2.0, warm highlights.",
    vanity_mirror: "Place this product on a glamorous vanity table next to a round mirror with soft warm bulb lighting. Gold and cream color palette. Editorial beauty photography, Hollywood vanity aesthetic, 50mm lens, f/2.8.",
  },
  tech: {
    modern_desk: "Place this product on a clean modern desk setup with a mechanical keyboard and monitor slightly out of focus in the background. Cool neutral lighting, minimal clutter. Tech product photography, 35mm lens, f/4, sharp and precise.",
    dark_gaming: "Place this product on a dark desk surface with subtle RGB neon glow (purple and blue) reflecting off the surface. Dark, moody gamer aesthetic with bokeh LED lights in background. Tech lifestyle photography, 50mm lens, f/2.0.",
    concrete_minimal: "Place this product on a raw concrete surface with a single green plant in a white pot nearby. Brutalist minimalist aesthetic, neutral tones, soft overhead studio lighting. Modern tech product photography, 90mm lens, f/5.6.",
    workspace_flat: "Place this product in a top-down flat-lay arrangement on a light gray desk with a notebook, pen, and wireless earbuds artfully arranged nearby. Clean overhead soft-box lighting. Professional workspace flat-lay photography.",
  },
  fashion: {
    velvet_display: "Place this product on a deep burgundy velvet fabric surface with soft directional lighting creating rich shadows. Luxury fashion accessory photography, jewelry and watch campaign aesthetic, 100mm macro lens, f/4.",
    boutique_shelf: "Place this product on a white lacquered boutique display shelf with soft fashion store ambient lighting. Blurred mannequin or clothing rack in the far background. High-end retail product photography, 50mm lens, f/2.8.",
    marble_vanity: "Place this product on a Carrara marble vanity surface next to a small perfume bottle and gold tray, slightly out of focus. Bright natural window light. Luxury fashion editorial photography, 85mm lens, f/2.0.",
    linen_flatlay: "Place this product on a crumpled natural linen fabric in a styled flat-lay composition with dried lavender and a gold ring nearby. Soft diffused overhead light. Fashion lifestyle flat-lay photography, top-down shot.",
  },
  food: {
    restaurant_table: "Place this product on a dark wood restaurant table with warm ambient candlelight and blurred wine glasses in the background. Moody food & beverage photography, 50mm lens, f/1.8, warm color temperature 3200K.",
    kitchen_prep: "Place this product on a professional kitchen prep station with fresh ingredients (lemons, herbs) scattered artfully nearby. Bright overhead kitchen lighting. Food brand campaign photography, 35mm lens, f/4.",
    picnic_outdoor: "Place this product on a checkered picnic blanket in a sun-dappled garden setting with soft natural light filtering through trees. Fresh and organic lifestyle photography, 50mm lens, f/2.8, golden hour warmth.",
    cafe_counter: "Place this product on a polished coffee shop counter with an espresso machine softly blurred in the background. Warm, inviting cafe atmosphere with ambient string lights. Artisan food & beverage photography, 35mm lens, f/2.0.",
  },
}
