import {
  authorizeGuild,
  guildIdFromPath,
  loadGuildChannels,
  sendUpstreamError,
} from '../../../_lib/dashboard.js'
import { getRequestUrl, methodNotAllowed, sendError, sendJson } from '../../../_lib/http.js'
import { withRateLimit } from '../../../_lib/rateLimit.js'
import { readSession } from '../../../_lib/session.js'

/**
 * The channel types a welcome, leave, boost or honeypot message can live in:
 * text, announcement and forum channels.
 */
const POSTABLE_CHANNEL_TYPES = new Set([0, 5, 15])

export default withRateLimit('dashboard_channels', 120, 60_000, async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const session = readSession(req)
  if (!session) return sendError(res, 401, 'unauthenticated', 'No active session.')

  const { path } = getRequestUrl(req)
  const guildId = guildIdFromPath(path)
  if (!guildId) return sendError(res, 404, 'not_found', 'Unknown route.')

  const access = await authorizeGuild(session, res, guildId)
  if (!access) return

  try {
    const channels = await loadGuildChannels(guildId)
    const list = channels
      .filter((channel) => POSTABLE_CHANNEL_TYPES.has(channel.type))
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: channel.parent_id ?? null,
        position: channel.position ?? 0,
      }))
      .sort((a, b) => a.position - b.position)

    sendJson(res, 200, { channels: list })
  } catch (error) {
    sendUpstreamError(res, error)
  }
})
