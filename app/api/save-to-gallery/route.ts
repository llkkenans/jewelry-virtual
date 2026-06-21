import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { generationId, imageUrl, type = 'jewelry' } = await req.json() as {
    generationId: string
    imageUrl: string
    type?: 'jewelry' | 'clothing' | 'product'
  }
  if (!generationId || !imageUrl) {
    return NextResponse.json({ error: 'generationId ve imageUrl gerekli' }, { status: 400 })
  }

  if (type === 'clothing') {
    const { data: gen } = await supabaseAdmin
      .from('clothing_generations')
      .select('id, user_id, is_saved')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (!gen) return NextResponse.json({ error: 'Görsel bulunamadı' }, { status: 404 })
    if (gen.is_saved) return NextResponse.json({ error: 'Zaten kaydedildi' }, { status: 400 })

    try {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error('Image fetch failed')
      const buffer = Buffer.from(await res.arrayBuffer())
      const key = `outputs/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      await uploadToR2(buffer, key, 'image/jpeg')

      await supabaseAdmin
        .from('clothing_generations')
        .update({ output_image_url: key, is_saved: true })
        .eq('id', generationId)

      const presignedUrl = await getPresignedUrl(key, 3600)
      return NextResponse.json({ saved: true, url: presignedUrl })
    } catch (err) {
      console.error('Save clothing to gallery failed:', err)
      return NextResponse.json({ error: 'Kaydetme başarısız' }, { status: 500 })
    }
  }

  if (type === 'product') {
    const { data: gen } = await supabaseAdmin
      .from('product_generations')
      .select('id, user_id, is_saved')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (!gen) return NextResponse.json({ error: 'Görsel bulunamadı' }, { status: 404 })
    if (gen.is_saved) return NextResponse.json({ error: 'Zaten kaydedildi' }, { status: 400 })

    try {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error('Image fetch failed')
      const buffer = Buffer.from(await res.arrayBuffer())
      const key = `outputs/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      await uploadToR2(buffer, key, 'image/jpeg')

      await supabaseAdmin
        .from('product_generations')
        .update({ output_image_url: key, is_saved: true })
        .eq('id', generationId)

      const presignedUrl = await getPresignedUrl(key, 3600)
      return NextResponse.json({ saved: true, url: presignedUrl })
    } catch (err) {
      console.error('Save product to gallery failed:', err)
      return NextResponse.json({ error: 'Kaydetme başarısız' }, { status: 500 })
    }
  }

  // type === 'jewelry' (default) — mevcut davranış değişmedi
  const { data: gen } = await supabaseAdmin
    .from('generations')
    .select('id, user_id, is_saved')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single()

  if (!gen) return NextResponse.json({ error: 'Görsel bulunamadı' }, { status: 404 })
  if (gen.is_saved) return NextResponse.json({ error: 'Zaten kaydedildi' }, { status: 400 })

  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error('Image fetch failed')
    const buffer = Buffer.from(await res.arrayBuffer())
    const key = `outputs/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    await uploadToR2(buffer, key, 'image/jpeg')

    await supabaseAdmin
      .from('generations')
      .update({ output_image_url: key, is_saved: true })
      .eq('id', generationId)

    const presignedUrl = await getPresignedUrl(key, 3600)
    return NextResponse.json({ saved: true, url: presignedUrl })
  } catch (err) {
    console.error('Save to gallery failed:', err)
    return NextResponse.json({ error: 'Kaydetme başarısız' }, { status: 500 })
  }
}
