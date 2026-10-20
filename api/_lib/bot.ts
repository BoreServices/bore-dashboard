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

export const botChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.number(),
  parent_id: z.string().nullable().optional(),
  position: z.number().optional(),
})

export const botChannelsSchema = z.object({ channels: z.array(botChannelSchema) })

export const botRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.number().optional(),
  position: z.number().optional(),
  managed: z.boolean().optional(),
  mentionable: z.boolean().optional(),
})

export const botRolesSchema = z.object({ roles: z.array(botRoleSchema) })

export type BotChannel = z.infer<typeof botChannelSchema>
export type BotRole = z.infer<typeof botRoleSchema>

/**
 * The routes the website is allowed to call on the bot API. The bot API is
 * the only party that holds the bot token, so guild channels and roles are
 * read through it rather than with the user's OAuth token — Discord removed
 * the user-token channel and role endpoints.
 */
export type BotApiPath =
  | '/commands'
  | '/status'
  | '/stats'
  | '/shards'
  | `/guilds/${string}`
  | `/guilds/${string}/channels`
  | `/guilds/${string}/roles`

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
  path: BotApiPath,
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

  const apiKey = env('BOT_API_KEY')
  const headers: Record<string, string> = { accept: 'application/json' }
  if (apiKey) headers['X-API-Key'] = apiKey

  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      signal: controller.signal,
      headers,
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
    if (response.status === 401 || response.status === 403) {
      throw new BotApiError(
        'bot_api_unauthorized',
        'The bot API rejected the configured API key.',
        502,
      )
    }
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

type BotGuildCache = { guilds: Set<string>; expiresAt: number }

let botGuildCache: BotGuildCache | null = null
const BOT_GUILD_CACHE_TTL_MS = 60_000

/**
 * The union of every shard's guild ids: the servers the bot is actually in.
 * Returns null when the bot API cannot be reached, so callers can report
 * "unknown" instead of "not installed".
 */
export async function getBotGuildIds(): Promise<Set<string> | null> {
  if (botGuildCache && botGuildCache.expiresAt > Date.now()) return botGuildCache.guilds

  try {
    const shards = await fetchBotApi('/shards', botShardsSchema)
    const guilds = new Set<string>()
    for (const ids of Object.values(shards)) {
      for (const id of ids) guilds.add(id)
    }
    botGuildCache = { guilds, expiresAt: Date.now() + BOT_GUILD_CACHE_TTL_MS }
    return guilds
  } catch {
    return null
  }
}

/** Raised when the bot is not a member of the requested guild. */
export class BotNotInGuildError extends Error {
  constructor() {
    super('Bore is not installed in this server.')
    this.name = 'BotNotInGuildError'
  }
}

export async function fetchBotGuildChannels(guildId: string): Promise<BotChannel[]> {
  try {
    const payload = await fetchBotApi(
      `/guilds/${encodeURIComponent(guildId)}/channels`,
      botChannelsSchema,
    )
    return payload.channels
  } catch (error) {
    if (error instanceof BotApiError && error.status === 404) throw new BotNotInGuildError()
    throw error
  }
}

export async function fetchBotGuildRoles(guildId: string): Promise<BotRole[]> {
  try {
    const payload = await fetchBotApi(
      `/guilds/${encodeURIComponent(guildId)}/roles`,
      botRolesSchema,
    )
    return payload.roles
  } catch (error) {
    if (error instanceof BotApiError && error.status === 404) throw new BotNotInGuildError()
    throw error
  }
}
