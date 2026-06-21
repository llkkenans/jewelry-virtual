import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json() as {
    generationId?: string
    generationIds?: string[]
    imageUrl?: string
    imageUrls?: string[]
    type?: 'jewelry' | 'clothing' | 'product'
  }
  const { type = 'jewelry' } = body

  // Batch shortcut: generationIds[] + imageUrls[] for product type
  if (type === 'product' && body.generationIds && body.imageUrls) {
    const { generationIds, imageUrls } = body
    if (generationIds.length !== imageUrls.length) {
      return NextResponse.json({ error: 'generationIds ve imageUrls uzunlukları eşit olmalı' }, { status: 400 })
    }
    const results = await Promise.allSettled(
      generationIds.map(async (gid, i) => {
        const { data: gen } = await supabaseAdmin
          .from('product_generations')
          .select('id, user_id, is_saved')
          .eq('id', gid)
          .eq('user_id', user.id)
          .single()
        if (!gen || gen.is_saved) return
        const res = await fetch(imageUrls[i])
        if (!res.ok) throw new Error('Image fetch failed')
        const buffer = Buffer.from(await res.arrayBuffer())
        const key = `outputs/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
        await uploadToR2(buffer, key, 'image/png')
        await supabaseAdmin.from('product_generations').update({ output_image_url: key, is_saved: true }).eq('id', gid)
      })
    )
    const saved = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ saved })
  }

  const { generationId, imageUrl } = body
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
