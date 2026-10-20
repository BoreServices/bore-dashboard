import { z } from 'zod'
import { env } from './env.js'

const DISCORD_API = 'https://discord.com/api/v10'
const REQUEST_TIMEOUT_MS = 8_000

export const discordUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  global_name: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
})

export const discordGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable().optional(),
  owner: z.boolean().optional(),
  approximate_member_count: z.number().nullable().optional(),
})

export const discordTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
})

export type DiscordUser = z.infer<typeof discordUserSchema>
export type DiscordGuild = z.infer<typeof discordGuildSchema>

export class DiscordApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 502) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function discordClientId(): string | null {
  return env('DISCORD_CLIENT_ID') ?? null
}

export function discordClientSecret(): string | null {
  return env('DISCORD_CLIENT_SECRET') ?? null
}

export function discordRedirectUri(fallbackOrigin: string | null): string | null {
  const configured = env('DISCORD_REDIRECT_URI')
  if (configured) return configured
  if (!fallbackOrigin) return null
  return `${fallbackOrigin.replace(/\/+$/, '')}/api/auth/callback`
}

export function avatarUrl(userId: string, avatar: string | null): string | null {
  if (!avatar) return null
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`
}

export function guildIconUrl(guildId: string, icon: string | null): string | null {
  if (!icon) return null
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=128`
}

async function discordFetch<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new DiscordApiError('discord_unreachable', 'Could not reach Discord.', 504)
  }

  const text = await response.text()
  let json: unknown = undefined
  try {
    json = text ? JSON.parse(text) : undefined
  } catch {
    json = undefined
  }

  if (!response.ok) {
    const message =
      typeof json === 'object' && json !== null && 'error_description' in json
        ? String((json as { error_description: unknown }).error_description)
        : `Discord responded with ${response.status}.`
    throw new DiscordApiError('discord_error', message, response.status === 401 ? 401 : 502)
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new DiscordApiError('discord_invalid_payload', 'Discord returned an unexpected payload.', 502)
  }
  return parsed.data
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<z.infer<typeof discordTokenSchema>> {
  const clientId = discordClientId()
  const clientSecret = discordClientSecret()
  if (!clientId || !clientSecret) {
    throw new DiscordApiError('oauth_not_configured', 'Discord OAuth is not configured.', 500)
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  return discordFetch(`${DISCORD_API}/oauth2/token`, discordTokenSchema, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
}

export async function fetchCurrentUser(accessToken: string): Promise<DiscordUser> {
  return discordFetch(`${DISCORD_API}/users/@me`, discordUserSchema, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
}

export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  return discordFetch(`${DISCORD_API}/users/@me/guilds`, z.array(discordGuildSchema), {
    headers: { authorization: `Bearer ${accessToken}` },
  })
}
