import { NextResponse, type NextRequest } from 'next/server'

// Minimal proxy — no Supabase import — to isolate 404 cause
// TODO: restore Supabase auth after confirming homepage loads
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect dashboard — redirect to login if not authenticated
  // (Full auth check restored once basic routing works)
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/dang-nhap', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
