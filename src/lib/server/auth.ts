import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const SESSION_COOKIE_NAME = 'session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.AUTH_PASSWORD || 'champion-blog-dev-secret'
}

export function getAuthPassword() {
  return process.env.AUTH_PASSWORD || process.env.NEXT_PUBLIC_PASSWORD || ''
}

function sign(payload: string) {
  return createHmac('sha256', getAuthSecret()).update(payload).digest('hex')
}

export function createSessionToken() {
  const payload = `${Date.now()}.${randomUUID()}`
  return `${payload}.${sign(payload)}`
}

export function isValidSessionToken(token?: string | null) {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length < 3) return false

  const signature = parts.pop()
  const payload = parts.join('.')
  if (!signature) return false

  const expected = sign(payload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  const [issuedAt] = payload.split('.')
  const issuedAtNumber = Number(issuedAt)
  if (!Number.isFinite(issuedAtNumber)) {
    return false
  }

  if (Date.now() - issuedAtNumber > SESSION_MAX_AGE * 1000) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export function buildSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=${SESSION_MAX_AGE}${secure}`
}

export function buildExpiredSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=0${secure}`
}

export function isAuthenticatedRequest(request: NextRequest) {
  return isValidSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

export async function isAuthenticatedServer() {
  const cookieStore = await cookies()
  return isValidSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}
