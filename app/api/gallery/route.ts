import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getPresignedUrl } from '@/lib/r2'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  const { data: generations, count } = await supabaseAdmin
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', 'done')
    .not('output_image_url', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (!generations) return NextResponse.json({ items: [], total: 0 })

  const items = await Promise.all(
    generations.map(async (gen) => {
      let imageUrl = gen.output_image_url
      if (imageUrl && imageUrl.startsWith('outputs/')) {
        try {
          imageUrl = await getPresignedUrl(imageUrl, 3600)
        } catch {
          imageUrl = null
        }
      }
      return { ...gen, output_image_url: imageUrl }
    })
  )

  return NextResponse.json({ items, total: count ?? 0, page, limit })
}
