import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/upload', '/gallery', '/billing', '/collections']
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Auth sayfalarında veya API'de middleware çalışmasın
  const isAuth = authRoutes.some(route => pathname.startsWith(route))
  const isApi = pathname.startsWith('/api')
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  if (isAuth || isApi || !isProtected) {
    return NextResponse.next()
  }

  // Supabase auth cookie'lerini kontrol et (birden fazla format olabilir)
  const cookies = req.cookies.getAll()
  const hasAuthCookie = cookies.some(c =>
    c.name.includes('sb-') && c.name.includes('auth-token')
  )

  if (!hasAuthCookie) {
    // Cookie yoksa bile geçir — client-side auth kontrolü yapacak
    // Bu sayede localStorage auth da çalışır
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|landing).*)'],
}
