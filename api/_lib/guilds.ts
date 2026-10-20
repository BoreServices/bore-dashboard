import { fetchUserGuild, fetchUserGuilds, guildIconUrl } from './discord.js'
import type { SessionGuild } from './session.js'

type CacheEntry = {
  guilds: SessionGuild[]
  /** The user's permission bitfield per guild, when Discord reports it. */
  permissions: Map<string, string>
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * The user's guild list is read from Discord on demand rather than stored in
 * the session cookie — a user can be in hundreds of servers, which would make
 * the cookie far too large.
 */
export async function getUserGuilds(accessToken: string): Promise<SessionGuild[]> {
  const cached = cache.get(accessToken)
  if (cached && cached.expiresAt > Date.now()) return cached.guilds

  const guilds = await fetchUserGuilds(accessToken)
  const mapped = guilds.map((guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guildIconUrl(guild.id, guild.icon ?? null),
    owner: guild.owner ?? false,
    memberCount: guild.approximate_member_count ?? null,
  }))

  const permissions = new Map<string, string>()
  for (const guild of guilds) {
    if (guild.permissions) permissions.set(guild.id, guild.permissions)
  }

  cache.set(accessToken, {
    guilds: mapped,
    permissions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
  return mapped
}

type PermissionEntry = { permissions: string; expiresAt: number }

const permissionCache = new Map<string, PermissionEntry>()

/**
 * Whether the single-guild endpoint works for this token. Discord reports the
 * bitfield in the guild list itself, so the per-guild request is only a
 * fallback — and it is not worth repeating once it turned out to be refused.
 */
const perGuildProbe = new Map<string, boolean>()

/**
 * The user's permission bitfield in one guild, as a decimal string.
 */
export async function getGuildPermissions(
  accessToken: string,
  guildId: string,
): Promise<string> {
  const key = `${accessToken}:${guildId}`
  const cached = permissionCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.permissions

  const fromList = cache.get(accessToken)?.permissions.get(guildId)
  if (fromList !== undefined) {
    permissionCache.set(key, { permissions: fromList, expiresAt: Date.now() + CACHE_TTL_MS })
    return fromList
  }

  if (perGuildProbe.get(accessToken) === false) return '0'

  let permissions = '0'
  try {
    const guild = await fetchUserGuild(accessToken, guildId)
    permissions = guild.permissions ?? '0'
    perGuildProbe.set(accessToken, true)
  } catch {
    perGuildProbe.set(accessToken, false)
    return '0'
  }

  permissionCache.set(key, { permissions, expiresAt: Date.now() + CACHE_TTL_MS })
  return permissions
}

/** Runs `fn` over `items` with a bounded number of requests in flight. */
export async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (index < items.length) {
        const current = index
        index += 1
        results[current] = await fn(items[current])
      }
    },
  )

  await Promise.all(workers)
  return results
}
