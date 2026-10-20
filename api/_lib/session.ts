import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { env, isProduction } from './env.js'

export const SESSION_COOKIE = 'bore_session'
export const OAUTH_STATE_COOKIE = 'bore_oauth_state'
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
const STATE_TTL_SECONDS = 10 * 60

export type SessionUser = {
  id: string
  username: string
  globalName: string | null
  avatar: string | null
}

export type SessionGuild = {
  id: string
  name: string
  icon: string | null
  owner: boolean
  memberCount: number | null
}

export type SessionPayload = {
  user: SessionUser
  accessToken: string
  exp: number
}

function key(secret: string): Buffer {
  return scryptSync(secret, 'bore.session.v1', 32)
}

export function encryptSession(payload: SessionPayload, secret: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.')
}

export function decryptSession(token: string, secret: string): SessionPayload | null {
  try {
    const [iv, tag, data] = token.split('.')
    if (!iv || !tag || !data) return null
    const decipher = createDecipheriv('aes-256-gcm', key(secret), Buffer.from(iv, 'base64url'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
    const payload = JSON.parse(decrypted) as SessionPayload
    if (!payload?.exp || payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    const name = part.slice(0, index).trim()
    const raw = part.slice(index + 1).trim()
    if (!name) continue
    try {
      out[name] = decodeURIComponent(raw)
    } catch {
      // A malformed cookie must not take the endpoint down.
      out[name] = raw
    }
  }
  return out
}

export function getCookie(req: IncomingMessage, name: string): string | undefined {
  return parseCookies(req)[name]
}

export function setCookie(
  res: ServerResponse,
  name: string,
  value: string,
  maxAgeSeconds: number,
): void {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (isProduction()) attributes.push('Secure')
  const existing = res.getHeader('set-cookie')
  const list = Array.isArray(existing)
    ? existing.map(String)
    : existing
      ? [String(existing)]
      : []
  res.setHeader('set-cookie', [...list, attributes.join('; ')])
}

export function clearCookie(res: ServerResponse, name: string): void {
  setCookie(res, name, '', 0)
}

export function sessionSecret(): string | null {
  return env('SESSION_SECRET') ?? null
}

export function readSession(req: IncomingMessage): SessionPayload | null {
  const secret = sessionSecret()
  if (!secret) return null
  const token = getCookie(req, SESSION_COOKIE)
  if (!token) return null
  return decryptSession(token, secret)
}

export function writeSession(
  res: ServerResponse,
  payload: Omit<SessionPayload, 'exp'>,
): void {
  const secret = sessionSecret()
  if (!secret) throw new Error('SESSION_SECRET is not configured')
  const token = encryptSession({ ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }, secret)
  setCookie(res, SESSION_COOKIE, token, SESSION_TTL_SECONDS)
}

/** Creates the OAuth `state` value and stores it in a short-lived cookie. */
export function createOAuthState(res: ServerResponse): string {
  const state = randomBytes(24).toString('hex')
  setCookie(res, OAUTH_STATE_COOKIE, state, STATE_TTL_SECONDS)
  return state
}

export function consumeOAuthState(req: IncomingMessage, received: string | null): boolean {
  const expected = getCookie(req, OAUTH_STATE_COOKIE)
  if (!expected || !received) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
