import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/home') ||
    request.nextUrl.pathname.startsWith('/write') ||
    request.nextUrl.pathname.startsWith('/api/posts')
  ) {
    const isAuthenticated = request.cookies.get('authenticated')

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/home/:path*', '/write/:path*'],
}
