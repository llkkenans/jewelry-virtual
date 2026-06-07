import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

type JewelryType = 'ring' | 'necklace' | 'bracelet'
const VALID_JEWELRY_TYPES: JewelryType[] = ['ring', 'necklace', 'bracelet']

export async function POST(req: NextRequest) {
  // 1. İstek gövdesinden imageBase64 ve jewelryType al
  let imageBase64: string, jewelryType: JewelryType
  try {
    const body = await req.json()
    ;({ imageBase64, jewelryType } = body as { imageBase64: string; jewelryType: JewelryType })
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!imageBase64 || !jewelryType) {
    return NextResponse.json(
      { error: 'Eksik parametre: imageBase64, jewelryType gerekli' },
      { status: 400 }
    )
  }

  if (!VALID_JEWELRY_TYPES.includes(jewelryType)) {
    return NextResponse.json(
      { error: `Geçersiz jewelryType. Geçerli değerler: ${VALID_JEWELRY_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // 2. Supabase session doğrula
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  // 3. Kredi kontrolü
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits <= 0) {
    return NextResponse.json({ error: 'Yetersiz kredi' }, { status: 403 })
  }

  // 4. public/models/{jewelryType}/ klasöründen rastgele model seç
  const modelsDir = path.join(process.cwd(), 'public', 'models', jewelryType)

  let files: string[]
  try {
    files = fs.readdirSync(modelsDir).filter(f =>
      /\.(jpg|jpeg|png|webp)$/i.test(f)
    )
  } catch {
    return NextResponse.json(
      { error: `Model klasörü bulunamadı: public/models/${jewelryType}/` },
      { status: 500 }
    )
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: `public/models/${jewelryType}/ klasöründe görsel yok` },
      { status: 500 }
    )
  }

  const randomFile = files[Math.floor(Math.random() * files.length)]
  const modelUrl = `/models/${jewelryType}/${randomFile}`
  console.log('Seçilen model:', modelUrl)

  // 5. generations tablosuna kayıt aç — INSERT trigger'ı krediyi düşürür
  const { data: generation, error: insertError } = await supabaseAdmin
    .from('generations')
    .insert({
      user_id: user.id,
      concept: jewelryType,
      status: 'done',
      credits_used: 1,
      output_image_url: modelUrl,
    })
    .select('id')
    .single()

  if (insertError || !generation) {
    return NextResponse.json({ error: 'Üretim kaydı oluşturulamadı' }, { status: 500 })
  }

  return NextResponse.json({ outputUrl: modelUrl, generationId: generation.id })
}
