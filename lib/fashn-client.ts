import Fashn from 'fashn'

const fashnClient = new Fashn({
  apiKey: process.env.FASHN_API_KEY || '',
})

export type FashnModelName =
  | 'product-to-model'
  | 'tryon-v1.6'
  | 'tryon-max'
  | 'model-create'
  | 'model-swap'
  | 'face-to-model'
  | 'edit'
  | 'reframe'
  | 'image-to-video'
  | 'background-remove'

export interface FashnResult {
  id: string
  status: string
  output: string[]
}

export async function runFashn(
  modelName: FashnModelName,
  inputs: Record<string, unknown>
): Promise<FashnResult> {
  const result = await fashnClient.predictions.subscribe(
    { model_name: modelName, inputs } as unknown as Parameters<typeof fashnClient.predictions.subscribe>[0]
  )

  return {
    id: result.id ?? '',
    status: result.status,
    output: (result.output as string[]) ?? [],
  }
}
