import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WINDOW_MS = 60 * 60 * 1000  // 1 saat
const MAX_REQUESTS = 10            // saatte max 10 istek

export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const key = `tryon:${identifier}`
  const windowStart = new Date(Date.now() - WINDOW_MS)

  // Mevcut kaydı çek
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, count, window_start')
    .eq('key', key)
    .single()

  if (!existing) {
    // İlk istek — yeni kayıt oluştur
    await supabase.from('rate_limits').insert({ key, count: 1 })
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: new Date(Date.now() + WINDOW_MS),
    }
  }

  const recordWindowStart = new Date(existing.window_start)

  if (recordWindowStart < windowStart) {
    // Pencere dolmuş, sıfırla
    await supabase
      .from('rate_limits')
      .update({ count: 1, window_start: new Date().toISOString() })
      .eq('key', key)
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: new Date(Date.now() + WINDOW_MS),
    }
  }

  if (existing.count >= MAX_REQUESTS) {
    // Limit dolmuş
    const resetAt = new Date(recordWindowStart.getTime() + WINDOW_MS)
    return { allowed: false, remaining: 0, resetAt }
  }

  // Sayacı artır
  await supabase
    .from('rate_limits')
    .update({ count: existing.count + 1 })
    .eq('key', key)

  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count - 1,
    resetAt: new Date(recordWindowStart.getTime() + WINDOW_MS),
  }
}
