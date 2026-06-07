const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1'
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY!
console.log('API KEY:', process.env.LEONARDO_API_KEY?.substring(0, 8))

const GENERATION_PARAMS = {
  num_images: 1,
  width: 1024,
  height: 1024,
  presetStyle: 'CINEMATIC',
}

// Görseli Leonardo init-image endpoint'ine yükler, image ID döner
async function uploadInitImage(imageBase64: string): Promise<string> {
  // 1. Presigned S3 URL al
  const initRes = await fetch(`${LEONARDO_API_URL}/init-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEONARDO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension: 'jpg' }),
  })

  if (!initRes.ok) {
    const errText = await initRes.text()
    throw new Error(`Init image başlatma hatası: ${initRes.status} ${errText}`)
  }

  const initData = await initRes.json()
  const { id, url, fields } = initData.uploadInitImage as {
    id: string
    url: string
    fields: string
  }

  console.log('Leonardo init image id:', id)

  // 2. S3'e multipart upload — fields önce, file en son
  const parsedFields = typeof fields === 'string' ? JSON.parse(fields) : fields
  const formData = new FormData()
  for (const [key, value] of Object.entries(parsedFields as Record<string, string>)) {
    formData.append(key, value)
  }
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }))

  const s3Res = await fetch(url, { method: 'POST', body: formData })
  if (!s3Res.ok) {
    const errText = await s3Res.text()
    throw new Error(`S3 upload hatası: ${s3Res.status} ${errText}`)
  }

  return id
}

export async function startGeneration(prompt: string, imageBase64?: string): Promise<string> {
  const body: Record<string, unknown> = { ...GENERATION_PARAMS, prompt }

  if (imageBase64) {
    const initImageId = await uploadInitImage(imageBase64)
    body.init_image_id = initImageId
    body.init_strength = 0.35
    console.log('Leonardo image-to-image modu, init_image_id:', initImageId)
  }

  const res = await fetch(`${LEONARDO_API_URL}/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEONARDO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Leonardo API response:', res.status, errText)
    throw new Error(`Leonardo başlatma hatası: ${res.status} ${errText}`)
  }

  const data = await res.json()
  const generationId = data.sdGenerationJob?.generationId
  if (!generationId) throw new Error('Leonardo generationId döndürmedi')
  return generationId
}

export async function pollGeneration(generationId: string): Promise<string> {
  const MAX_ATTEMPTS = 20
  const DELAY_MS = 3000

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS))

    const res = await fetch(`${LEONARDO_API_URL}/generations/${generationId}`, {
      headers: { 'Authorization': `Bearer ${LEONARDO_API_KEY}` },
    })

    if (!res.ok) continue

    const data = await res.json()
    const gen = data.generations_by_pk

    if (gen?.status === 'COMPLETE') {
      const url = gen.generated_images?.[0]?.url
      if (!url) throw new Error('Tamamlanan üretimde görsel URL bulunamadı')
      return url
    }

    if (gen?.status === 'FAILED') {
      throw new Error('Leonardo üretimi başarısız')
    }
  }

  throw new Error('Leonardo üretimi zaman aşımına uğradı')
}
