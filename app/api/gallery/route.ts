import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getPresignedUrl } from '@/lib/r2'

async function resolvePresignedUrl(rawUrl: string | null): Promise<string | null> {
  if (!rawUrl) return null
  if (rawUrl.startsWith('outputs/')) {
    try { return await getPresignedUrl(rawUrl, 3600) } catch { return null }
  }
  if (rawUrl.includes('r2.cloudflarestorage.com')) {
    const keyMatch = rawUrl.match(/\.com\/(.+)$/)
    if (keyMatch) {
      try { return await getPresignedUrl(keyMatch[1], 3600) } catch { return null }
    }
  }
  return rawUrl
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type') ?? 'jewelry'
  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')
  const limit = 12
  const offset = (page - 1) * limit

  if (type === 'clothing') {
    const { data: rows, count } = await supabaseAdmin
      .from('clothing_generations')
      .select('id, category, gender, skin_tone, output_image_url, is_saved, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_saved', true)
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!rows) return NextResponse.json({ items: [], total: 0 })

    const items = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        output_image_url: await resolvePresignedUrl(row.output_image_url),
      }))
    )

    return NextResponse.json({ items, total: count ?? 0, page, limit })
  }

  // type === 'jewelry' (default) — mevcut davranış değişmedi
  const { data: generations, count } = await supabaseAdmin
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', 'done')
    .eq('is_saved', true)
    .not('output_image_url', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (!generations) return NextResponse.json({ items: [], total: 0 })

  const items = await Promise.all(
    generations.map(async (gen) => ({
      ...gen,
      output_image_url: await resolvePresignedUrl(gen.output_image_url),
    }))
  )

  return NextResponse.json({ items, total: count ?? 0, page, limit })
}
