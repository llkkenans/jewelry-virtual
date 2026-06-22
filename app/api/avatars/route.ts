import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getPresignedUrl } from '@/lib/r2'

type AvatarRow = {
  id: string
  name: string
  gender: string
  skin_tone: string
  description: string | null
  scenes: string[] | null
}

export async function GET() {
  const { data: rows, error } = await supabaseAdmin
    .from('avatars')
    .select('id, name, gender, skin_tone, description, scenes')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const avatars = await Promise.all(
    (rows as AvatarRow[]).map(async (a) => {
      const previewUrl = await getPresignedUrl(
        `clothing-references/avatars/${a.id}/preview.png`,
        3600
      )
      return {
        id: a.id,
        name: a.name,
        gender: a.gender,
        skinTone: a.skin_tone,
        description: a.description,
        scenes: a.scenes ?? ['studio'],
        previewUrl,
      }
    })
  )

  return NextResponse.json({ avatars })
}
