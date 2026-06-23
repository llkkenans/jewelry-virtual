import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadToR2, getPresignedUrl } from '@/lib/r2'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  // Auth
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  // Parse body
  let imageBase64: string, name: string
  try {
    const body = await req.json()
    imageBase64 = body.imageBase64
    name = body.name ?? 'Model'
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'Görsel gerekli (imageBase64)' }, { status: 400 })
  }

  // Upload to R2
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const imageKey = `user-models/${user.id}/${Date.now()}.png`

  try {
    await uploadToR2(imageBuffer, imageKey, 'image/png')
  } catch (err) {
    console.error('R2 upload failed:', err)
    return NextResponse.json({ error: 'Görsel yüklenemedi' }, { status: 500 })
  }

  // Insert into DB
  const { data: model, error: dbError } = await supabaseAdmin
    .from('user_models')
    .insert({
      user_id: user.id,
      name,
      image_key: imageKey,
    })
    .select('id, name, image_key')
    .single()

  if (dbError || !model) {
    console.error('DB insert error:', dbError)
    return NextResponse.json({ error: 'Model kaydedilemedi' }, { status: 500 })
  }

  const previewUrl = await getPresignedUrl(model.image_key, 3600)

  return NextResponse.json({
    id: model.id,
    name: model.name,
    previewUrl,
  })
}

export async function GET(req: NextRequest) {
  // Auth
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  // Query models
  const { data: rows, error: dbError } = await supabaseAdmin
    .from('user_models')
    .select('id, name, image_key, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) {
    console.error('DB query error:', dbError)
    return NextResponse.json({ error: 'Modeller alınamadı' }, { status: 500 })
  }

  const models = await Promise.all(
    (rows ?? []).map(async (row) => ({
      id: row.id as string,
      name: row.name as string,
      previewUrl: await getPresignedUrl(row.image_key as string, 3600),
      createdAt: row.created_at as string,
    }))
  )

  return NextResponse.json({ models })
}
