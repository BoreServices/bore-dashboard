import { z } from 'zod'
import { env } from './env.js'

export const botCommandSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  args: z.string().nullable().optional(),
  syntax: z.string().nullable().optional(),
  permissions: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  aliases: z.array(z.string()).optional(),
  cooldown: z.string().nullable().optional(),
  example: z.string().nullable().optional(),
  flags: z.array(z.string()).optional(),
})

export const botCommandsSchema = z.record(z.array(botCommandSchema))

export const botShardSchema = z.object({
  shard_id: z.number(),
  is_ready: z.boolean(),
  server_count: z.number(),
  cached_user_count: z.number(),
  uptime: z.number(),
  latency: z.number(),
})

export const botStatusSchema = z.object({
  shards: z.array(botShardSchema),
})

export const botStatsSchema = z.object({
  members: z.number(),
  servers: z.number(),
})

export const botShardsSchema = z.record(z.array(z.string()))

export type BotCommand = z.infer<typeof botCommandSchema>
export type BotStatus = z.infer<typeof botStatusSchema>
export type BotStats = z.infer<typeof botStatsSchema>

export class BotApiError extends Error {
  status: number
  code: string

  constructor(code: string, message: string, status = 502) {
    super(message)
    this.code = code
    this.status = status
  }
}

const REQUEST_TIMEOUT_MS = 6_000
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024

export function botApiBaseUrl(): string | null {
  const base = env('BOT_API_BASE_URL')
  if (!base) return null
  return base.replace(/\/+$/, '')
}

/**
 * The bot API is a separately hosted Flask service. We only ever request the
 * four documented routes — the frontend never controls the upstream URL.
 */
export async function fetchBotApi<T>(
  path: '/commands' | '/status' | '/stats' | '/shards',
  schema: z.ZodType<T>,
): Promise<T> {
  const base = botApiBaseUrl()
  if (!base) {
    throw new BotApiError(
      'bot_api_unconfigured',
      'BOT_API_BASE_URL is not configured for this deployment.',
      503,
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    const aborted = controller.signal.aborted
    throw new BotApiError(
      aborted ? 'bot_api_timeout' : 'bot_api_unreachable',
      aborted
        ? 'The bot API did not respond in time.'
        : 'The bot API could not be reached.',
      504,
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new BotApiError(
      'bot_api_error',
      `The bot API responded with ${response.status}.`,
      response.status >= 500 ? 502 : response.status,
    )
  }

  const length = Number(response.headers.get('content-length') ?? '0')
  if (length && length > MAX_RESPONSE_BYTES) {
    throw new BotApiError('bot_api_response_too_large', 'The bot API response was too large.', 502)
  }

  const text = await response.text()
  if (text.length > MAX_RESPONSE_BYTES) {
    throw new BotApiError('bot_api_response_too_large', 'The bot API response was too large.', 502)
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BotApiError('bot_api_invalid_json', 'The bot API returned malformed JSON.', 502)
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new BotApiError(
      'bot_api_invalid_payload',
      'The bot API returned an unexpected payload shape.',
      502,
    )
  }
  return parsed.data
}
