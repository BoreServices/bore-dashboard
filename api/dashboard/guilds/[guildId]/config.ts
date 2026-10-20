import { getBotGuildIds } from '../../../_lib/bot.js'
import { SchemaMismatchError } from '../../../_lib/db.js'
import {
  authorizeGuild,
  guildIdFromPath,
  readAliasConfig,
  readAntinukeConfig,
  readAutoroleConfig,
  readGuildDirectory,
  readHoneypotConfig,
  readMessageConfig,
  readPrefixConfig,
  sendUpstreamError,
} from '../../../_lib/dashboard.js'
import { getRequestUrl, methodNotAllowed, sendError, sendJson } from '../../../_lib/http.js'
import { buildBotInviteUrl } from '../../../_lib/invite.js'
import { withRateLimit } from '../../../_lib/rateLimit.js'
import { readSession } from '../../../_lib/session.js'

export default withRateLimit('dashboard_config', 120, 60_000, async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const session = readSession(req)
  if (!session) return sendError(res, 401, 'unauthenticated', 'No active session.')

  const { path } = getRequestUrl(req)
  const guildId = guildIdFromPath(path)
  if (!guildId) return sendError(res, 404, 'not_found', 'Unknown route.')

  const access = await authorizeGuild(session, res, guildId)
  if (!access) return

  try {
    const directory = await readGuildDirectory(guildId)
    const channelNames = directory.channels
    const roleNames = directory.roles

    const [prefix, welcome, leave, boost, autoroles, antinuke, honeypot] = await Promise.all([
      readPrefixConfig(guildId),
      readMessageConfig(guildId, 'welcome', channelNames),
      readMessageConfig(guildId, 'leave', channelNames),
      readMessageConfig(guildId, 'boost', channelNames),
      readAutoroleConfig(guildId, roleNames),
      readAntinukeConfig(guildId),
      readHoneypotConfig(guildId, channelNames),
    ])

    // A table with an older layout must not take the whole dashboard down.
    const warnings: string[] = []
    let aliases: { alias: string; command: string }[] = []
    try {
      aliases = await readAliasConfig(guildId)
    } catch (error) {
      if (error instanceof SchemaMismatchError) {
        warnings.push(error.message)
      } else {
        throw error
      }
    }

    const botGuilds = await getBotGuildIds()

    sendJson(res, 200, {
      guild: {
        id: access.guild.id,
        name: access.guild.name,
        icon: access.guild.icon,
        owner: access.guild.owner,
        memberCount: access.guild.memberCount,
        permissions: access.permissions,
        botInstalled: botGuilds ? botGuilds.has(guildId) : null,
        installUrl:
          botGuilds && !botGuilds.has(guildId) ? buildBotInviteUrl(guildId) : null,
      },
      prefix,
      welcome,
      leave,
      boost,
      autoroles,
      aliases,
      antinuke,
      honeypot,
      warnings,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    sendUpstreamError(res, error)
  }
})
