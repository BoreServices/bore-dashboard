import { z } from 'zod'
import type { ApiHandler } from './http.js'
import { methodNotAllowed, sendError, sendJson } from './http.js'
import { BotApiError, fetchBotApi } from './bot.js'

export type BotProxyRoute = '/commands' | '/status' | '/stats' | '/shards'

/** The bot reports missing metadata as the literal string "None". */
export function noneToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'none') return null
  return value
}

export function normalizePermissions(
  permissions: string | string[] | null | undefined,
): string[] {
  if (permissions === undefined || permissions === null) return []
  if (typeof permissions === 'string') {
    const value = noneToNull(permissions)
    return value ? [value] : []
  }
  return permissions.map((entry) => entry.trim()).filter((entry) => entry.length > 0 && entry !== 'None')
}

/**
 * Builds a GET handler that proxies one documented bot API route and returns
 * validated JSON to the browser.
 */
export function botProxyHandler<T>(
  route: BotProxyRoute,
  schema: z.ZodType<T>,
  transform?: (payload: T) => unknown,
): ApiHandler {
  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return methodNotAllowed(res, ['GET'])
    }
    try {
      const payload = await fetchBotApi(route, schema)
      const body = transform ? transform(payload) : payload
      sendJson(res, 200, { ...(body as object), fetchedAt: new Date().toISOString() })
    } catch (error) {
      if (error instanceof BotApiError) {
        return sendError(res, error.status, error.code, error.message)
      }
      sendError(res, 500, 'internal_error', 'Unexpected server error.')
    }
  }
}
