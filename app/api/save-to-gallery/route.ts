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
    type?: 'jewelry' | 'clothing' | 'product'
  }
  const { type = 'jewelry' } = body

  // Batch shortcut: generationIds[] for product type — images already in R2
  if (type === 'product' && body.generationIds) {
    const { generationIds } = body
    console.log(`SAVE: type=product batch, ids=${generationIds.join(',')}`)
    const results = await Promise.allSettled(
      generationIds.map(async (gid) => {
        const { data: gen } = await supabaseAdmin
          .from('product_generations')
          .select('id, user_id, is_saved')
          .eq('id', gid)
          .eq('user_id', user.id)
          .single()
        if (!gen) throw new Error(`gen not found: ${gid}`)
        if (gen.is_saved) return // already saved, skip silently
        await supabaseAdmin.from('product_generations').update({ is_saved: true }).eq('id', gid)
        console.log(`SAVE: product batch item saved, id=${gid}`)
      })
    )
    const saved = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ saved })
  }

  const { generationId, imageUrl } = body
  console.log('SAVE RECEIVED:', { type, generationId, hasImageUrl: !!imageUrl })
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
    console.log(`SAVE: type=product, id=${generationId}`)

    const { data: gen, error: genError } = await supabaseAdmin
      .from('product_generations')
      .select('id, user_id, is_saved, output_image_url')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    console.log(`SAVE: product gen lookup →`, genError?.message ?? 'OK', 'is_saved:', gen?.is_saved, 'r2key:', gen?.output_image_url)

    if (!gen) return NextResponse.json({ error: 'Görsel bulunamadı' }, { status: 404 })
    // Idempotent: already saved → return OK instead of 400
    if (gen.is_saved) {
      const existingUrl = gen.output_image_url
        ? await getPresignedUrl(gen.output_image_url, 3600).catch(() => imageUrl)
        : imageUrl
      return NextResponse.json({ saved: true, url: existingUrl })
    }

    try {
      // Image is already in R2 from generation — just flip is_saved, no re-upload needed
      await supabaseAdmin
        .from('product_generations')
        .update({ is_saved: true })
        .eq('id', generationId)

      const presignedUrl = gen.output_image_url
        ? await getPresignedUrl(gen.output_image_url, 3600).catch(() => imageUrl)
        : imageUrl

      console.log(`SAVE: product saved OK, id=${generationId}`)
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
