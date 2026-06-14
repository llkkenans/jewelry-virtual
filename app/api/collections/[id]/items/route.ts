import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// POST — koleksiyona görsel ekle
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { generation_id } = await req.json()

  // Koleksiyonun bu kullanıcıya ait olduğunu doğrula
  const { data: collection } = await supabaseAdmin
    .from('collections')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!collection) return NextResponse.json({ error: 'Koleksiyon bulunamadı' }, { status: 404 })

  const { error: dbError } = await supabaseAdmin
    .from('collection_items')
    .insert({ collection_id: params.id, generation_id })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — koleksiyondan görsel çıkar
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { generation_id } = await req.json()

  const { error: dbError } = await supabaseAdmin
    .from('collection_items')
    .delete()
    .eq('collection_id', params.id)
    .eq('generation_id', generation_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
