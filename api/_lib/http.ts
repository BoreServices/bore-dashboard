import type { IncomingMessage, ServerResponse } from 'node:http'

export type ApiHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void> | void

export type RequestUrl = {
  path: string
  query: URLSearchParams
}

/**
 * Request URLs arrive with the query string attached in both Vercel and the
 * Vite dev middleware, so we parse it once here instead of relying on either
 * framework's request wrapper.
 */
export function getRequestUrl(req: IncomingMessage): RequestUrl {
  const raw = req.url ?? '/'
  const parsed = new URL(raw, 'http://localhost')
  return { path: parsed.pathname, query: parsed.searchParams }
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  })
  res.end(payload)
}

export function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
): void {
  sendJson(res, status, { error: code, message, ...extra })
}

export function methodNotAllowed(res: ServerResponse, allowed: string[]): void {
  res.writeHead(405, {
    allow: allowed.join(', '),
    'content-type': 'application/json; charset=utf-8',
  })
  res.end(JSON.stringify({ error: 'method_not_allowed', message: 'Method not allowed.' }))
}

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const ip = raw?.split(',')[0]?.trim()
  return ip || req.socket.remoteAddress || 'unknown'
}

const MAX_BODY_BYTES = 16 * 1024

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buf.length
    if (size > MAX_BODY_BYTES) throw new Error('payload_too_large')
    chunks.push(buf)
  }
  if (!chunks.length) return undefined
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
