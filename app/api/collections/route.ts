import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET — kullanıcının koleksiyonlarını listele
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data, error: dbError } = await supabaseAdmin
    .from('collections')
    .select(`
      id, name, cover_image_url, created_at,
      collection_items(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ collections: data })
}

// POST — yeni koleksiyon oluştur
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { name, cover_image_url } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })

  const { data, error: dbError } = await supabaseAdmin
    .from('collections')
    .insert({ user_id: user.id, name: name.trim(), cover_image_url })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ collection: data })
}
