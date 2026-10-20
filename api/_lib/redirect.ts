import type { IncomingMessage, ServerResponse } from 'node:http'
import { getCookie, setCookie, clearCookie } from './session.js'
import { safeNextPath } from '../../src/lib/redirect.js'

export { safeNextPath }

const NEXT_COOKIE = 'bore_oauth_next'

export function rememberNextPath(res: ServerResponse, path: string): void {
  setCookie(res, NEXT_COOKIE, path, 10 * 60)
}

/** Reads and clears the stored post-login path. */
export function takeNextPath(req: IncomingMessage, res?: ServerResponse): string {
  const stored = safeNextPath(getCookie(req, NEXT_COOKIE))
  if (res) clearCookie(res, NEXT_COOKIE)
  return stored ?? '/dashboard'
}
