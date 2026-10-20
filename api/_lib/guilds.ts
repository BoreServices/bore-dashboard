import { fetchUserGuilds, guildIconUrl } from './discord.js'
import type { SessionGuild } from './session.js'

type CacheEntry = { guilds: SessionGuild[]; expiresAt: number }

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

  cache.set(accessToken, { guilds: mapped, expiresAt: Date.now() + CACHE_TTL_MS })
  return mapped
}
