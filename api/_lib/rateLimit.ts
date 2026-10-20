import { getClientIp, sendError } from './http.js'
import type { ApiHandler } from './http.js'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/**
 * Best-effort fixed-window rate limiter. Serverless instances are ephemeral,
 * so this guards a single noisy client rather than enforcing a global quota.
 */
export function withRateLimit(
  scope: string,
  limit: number,
  windowMs: number,
  handler: ApiHandler,
): ApiHandler {
  return async (req, res) => {
    const now = Date.now()
    const key = `${scope}:${getClientIp(req)}`
    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
    } else {
      bucket.count += 1
      if (bucket.count > limit) {
        sendError(res, 429, 'rate_limited', 'Too many requests. Please slow down.')
        return
      }
    }
    await handler(req, res)
  }
}

const timer = setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key)
}, 60_000)
if (typeof timer.unref === 'function') timer.unref()
