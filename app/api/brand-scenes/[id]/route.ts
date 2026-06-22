import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = params

  const { error } = await supabaseAdmin
    .from('brand_scenes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Brand scene delete error:', error)
    return NextResponse.json({ error: 'Silme başarısız' }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
