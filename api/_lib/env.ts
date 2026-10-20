import type { IncomingHttpHeaders } from 'node:http'

export function env(name: string): string | undefined {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : undefined
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

/**
 * Public site origin, used for OAuth redirects and absolute links.
 *
 * `SITE_URL` is required in production: deriving the origin from the request
 * headers would let a spoofed `Host` header become an open redirect.
 */
export function siteOrigin(req: { headers: IncomingHttpHeaders }): string | null {
  const configured = env('SITE_URL') || env('PUBLIC_SITE_URL')
  if (configured) return configured.replace(/\/+$/, '')
  if (isProduction()) return null

  const headers = req.headers ?? {}
  const host = headers['x-forwarded-host'] ?? headers.host
  const proto = headers['x-forwarded-proto'] ?? 'http'
  if (typeof host === 'string' && host) return `${proto}://${host}`
  return 'http://localhost:5173'
}
