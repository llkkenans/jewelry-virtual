import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const protectedRoutes = ['/upload', '/gallery', '/billing', '/collections']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('sb-zdsjqkopelwubedftaxr-auth-token')?.value
    || req.cookies.get('sb-zdsjqkopelwubedftaxr-auth-token.0')?.value

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/upload/:path*', '/gallery/:path*', '/billing/:path*', '/collections/:path*'],
}
