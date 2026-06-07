const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1'
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY!

const GENERATION_PARAMS = {
  num_images: 1,
  width: 1024,
  height: 1024,
  presetStyle: 'CINEMATIC',
}

export async function startGeneration(prompt: string): Promise<string> {
  const res = await fetch(`${LEONARDO_API_URL}/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEONARDO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...GENERATION_PARAMS, prompt }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Leonardo başlatma hatası: ${JSON.stringify(err)}`)
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
