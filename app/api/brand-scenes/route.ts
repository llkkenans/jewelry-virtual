import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const MAX_SCENES_PER_USER = 10

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: scenes, error } = await supabaseAdmin
    .from('brand_scenes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ scenes })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  let body: {
    name: string
    referenceImageUrl: string
    scenePrompt: string
    sceneType?: string
    industry?: string
    industryScene?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  const { name, referenceImageUrl, scenePrompt, sceneType, industry, industryScene } = body

  if (!name || !referenceImageUrl || !scenePrompt) {
    return NextResponse.json(
      { error: 'Eksik parametre: name, referenceImageUrl, scenePrompt gerekli' },
      { status: 400 }
    )
  }

  const { count, error: countError } = await supabaseAdmin
    .from('brand_scenes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

  if ((count ?? 0) >= MAX_SCENES_PER_USER) {
    return NextResponse.json(
      { error: `Maksimum ${MAX_SCENES_PER_USER} sahne kaydedebilirsiniz. Lütfen önce bir sahneyi silin.` },
      { status: 422 }
    )
  }

  const { data: scene, error: insertError } = await supabaseAdmin
    .from('brand_scenes')
    .insert({
      user_id: user.id,
      name,
      reference_image_url: referenceImageUrl,
      scene_prompt: scenePrompt,
      scene_type: sceneType ?? null,
      industry: industry ?? null,
      industry_scene: industryScene ?? null,
    })
    .select('*')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({ scene }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  let sceneId: string
  try {
    ;({ sceneId } = await req.json() as { sceneId: string })
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  if (!sceneId) {
    return NextResponse.json({ error: 'Eksik parametre: sceneId gerekli' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('brand_scenes')
    .delete()
    .eq('id', sceneId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true })
}
