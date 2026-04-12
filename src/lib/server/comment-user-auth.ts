import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const USER_SESSION_COOKIE_NAME = 'user_session'
const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30

export interface CommentUserSession {
  userId: string
  username: string
  displayName: string
}

interface SessionPayload extends CommentUserSession {
  issuedAt: number
}

function getUserSessionSecret() {
  return `${process.env.AUTH_SECRET || process.env.AUTH_PASSWORD || 'champion-blog-user-secret'}:comment-users`
}

function sign(payload: string) {
  return createHmac('sha256', getUserSessionSecret()).update(payload).digest('hex')
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(raw: string) {
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8')) as SessionPayload
  } catch {
    return null
  }
}

export function hashUserPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyUserPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':')
  if (!salt || !originalHash) return false

  const nextHash = scryptSync(password, salt, 64).toString('hex')
  const originalBuffer = Buffer.from(originalHash, 'hex')
  const nextBuffer = Buffer.from(nextHash, 'hex')
  if (originalBuffer.length !== nextBuffer.length) return false
  return timingSafeEqual(originalBuffer, nextBuffer)
}

export function createUserSessionToken(session: CommentUserSession) {
  const encodedPayload = encodePayload({
    ...session,
    issuedAt: Date.now(),
  })
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function parseUserSessionToken(token?: string | null) {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = sign(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (signatureBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null

  const payload = decodePayload(encodedPayload)
  if (!payload) return null
  if (Date.now() - payload.issuedAt > USER_SESSION_MAX_AGE * 1000) return null

  return {
    userId: payload.userId,
    username: payload.username,
    displayName: payload.displayName,
  } satisfies CommentUserSession
}

export function buildUserSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${USER_SESSION_COOKIE_NAME}=${token}; Path=/; SameSite=Lax; Max-Age=${USER_SESSION_MAX_AGE}${secure}`
}

export function buildExpiredUserSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${USER_SESSION_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0${secure}`
}

export function getCommentUserFromRequest(request: NextRequest) {
  return parseUserSessionToken(request.cookies.get(USER_SESSION_COOKIE_NAME)?.value)
}

export async function getCommentUserFromServer() {
  const cookieStore = await cookies()
  return parseUserSessionToken(cookieStore.get(USER_SESSION_COOKIE_NAME)?.value)
}
