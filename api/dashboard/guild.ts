import { databaseConfigured, fetchGuildPrefix } from '../_lib/db.js'
import { getUserGuilds } from '../_lib/guilds.js'
import { getRequestUrl, methodNotAllowed, sendError, sendJson } from '../_lib/http.js'
import { readSession } from '../_lib/session.js'

/** The bot's fallback prefix when a guild has no row in the `prefix` table. */
export const DEFAULT_PREFIX = ','

export default async function handler(
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
): Promise<void> {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const session = readSession(req)
  if (!session) return sendError(res, 401, 'unauthenticated', 'No active session.')

  const { query } = getRequestUrl(req)
  const guildId = query.get('guildId')
  if (!guildId) return sendError(res, 400, 'missing_guild', 'A guildId is required.')

  // Possession of a guild id is not proof of access: the guild must be in the
  // signed-in user's own guild list.
  let guilds: Awaited<ReturnType<typeof getUserGuilds>>
  try {
    guilds = await getUserGuilds(session.accessToken)
  } catch {
    return sendError(res, 503, 'discord_unavailable', 'The guild list could not be verified.')
  }

  const guild = guilds.find((entry) => entry.id === guildId)
  if (!guild) {
    return sendError(res, 403, 'forbidden', 'You do not manage this server.')
  }

  if (!databaseConfigured()) {
    return sendJson(res, 200, {
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: guild.owner,
        memberCount: guild.memberCount,
      },
      prefix: null,
      prefixSource: 'unavailable' as const,
      databaseConfigured: false,
    })
  }

  try {
    const stored = await fetchGuildPrefix(guild.id)
    return sendJson(res, 200, {
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: guild.owner,
        memberCount: guild.memberCount,
      },
      prefix: stored || DEFAULT_PREFIX,
      prefixSource: stored ? ('database' as const) : ('default' as const),
      databaseConfigured: true,
    })
  } catch {
    return sendError(res, 503, 'database_unavailable', 'The database could not be reached.')
  }
}
