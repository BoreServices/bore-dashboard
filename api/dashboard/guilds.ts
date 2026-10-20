import { getBotGuildIds } from '../_lib/bot.js'
import { buildBotInviteUrl } from '../_lib/invite.js'
import { getGuildPermissions, getUserGuilds, mapWithLimit } from '../_lib/guilds.js'
import { methodNotAllowed, sendError, sendJson } from '../_lib/http.js'
import { withRateLimit } from '../_lib/rateLimit.js'
import { readSession } from '../_lib/session.js'

export default withRateLimit('dashboard_guilds', 120, 60_000, async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const session = readSession(req)
  if (!session) return sendError(res, 401, 'unauthenticated', 'No active session.')

  let guilds: Awaited<ReturnType<typeof getUserGuilds>>
  try {
    guilds = await getUserGuilds(session.accessToken)
  } catch {
    return sendError(res, 503, 'discord_unavailable', 'The guild list could not be verified.')
  }

  // Discord only reports the permission bitfield per guild.
  const permissions = await mapWithLimit(guilds, 8, async (guild) => {
    try {
      return await getGuildPermissions(session.accessToken, guild.id)
    } catch {
      return '0'
    }
  })

  const botGuilds = await getBotGuildIds()

  const list = guilds
    .map((guild, index) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      owner: guild.owner,
      memberCount: guild.memberCount,
      permissions: permissions[index] ?? '0',
      botInstalled: botGuilds ? botGuilds.has(guild.id) : null,
      installUrl:
        botGuilds && !botGuilds.has(guild.id) ? buildBotInviteUrl(guild.id) : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  sendJson(res, 200, { guilds: list, fetchedAt: new Date().toISOString() })
})
