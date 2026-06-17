import { supabaseAdmin } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/upload'

  if (token_hash && type) {
    const { error } = await supabaseAdmin.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }
  return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
}
