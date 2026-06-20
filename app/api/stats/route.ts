import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const [
    jewelryTotalRes,
    jewelryByCategoryRes,
    jewelryDailyRes,
    clothingTotalRes,
    clothingByCategoryRes,
    clothingDailyRes,
    profileRes,
  ] = await Promise.all([
    supabaseAdmin
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done'),

    supabaseAdmin
      .from('generations')
      .select('jewelry_type')
      .eq('user_id', user.id)
      .eq('status', 'done'),

    supabaseAdmin
      .from('generations')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

    supabaseAdmin
      .from('clothing_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done'),

    supabaseAdmin
      .from('clothing_generations')
      .select('category')
      .eq('user_id', user.id)
      .eq('status', 'done'),

    supabaseAdmin
      .from('clothing_generations')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

    supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single(),
  ])

  // Jewelry by category
  const jewelryByCategory = { ring: 0, necklace: 0, earring: 0, watch: 0 }
  for (const row of jewelryByCategoryRes.data ?? []) {
    const t = row.jewelry_type as keyof typeof jewelryByCategory
    if (t in jewelryByCategory) jewelryByCategory[t]++
  }

  // Clothing by category
  const clothingByCategory = { tops: 0, bottoms: 0, onepiece: 0 }
  for (const row of clothingByCategoryRes.data ?? []) {
    if (row.category === 'tops') clothingByCategory.tops++
    else if (row.category === 'bottoms') clothingByCategory.bottoms++
    else if (row.category === 'one-pieces') clothingByCategory.onepiece++
  }

  // Build daily counts helper
  function buildDaily(rows: { created_at: string }[]): { date: string; count: number }[] {
    const map: Record<string, number> = {}
    for (const row of rows) {
      const date = row.created_at.slice(0, 10)
      map[date] = (map[date] ?? 0) + 1
    }
    // Fill all 30 days
    const result: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      result.push({ date: key, count: map[key] ?? 0 })
    }
    return result
  }

  return NextResponse.json({
    jewelry: {
      total: jewelryTotalRes.count ?? 0,
      byCategory: jewelryByCategory,
      daily: buildDaily(jewelryDailyRes.data ?? []),
    },
    clothing: {
      total: clothingTotalRes.count ?? 0,
      byCategory: clothingByCategory,
      daily: buildDaily(clothingDailyRes.data ?? []),
    },
    credits: profileRes.data?.credits ?? 0,
  })
}
