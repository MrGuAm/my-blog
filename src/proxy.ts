import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // /write pages require login
  if (path.startsWith('/write')) {
    const isAuthenticated = request.cookies.get('authenticated')
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // POST/PUT/DELETE on /api/posts require login (reading is public)
  if (path.startsWith('/api/posts') && request.method !== 'GET') {
    const isAuthenticated = request.cookies.get('authenticated')
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/write/:path*', '/api/posts/:path*'],
}