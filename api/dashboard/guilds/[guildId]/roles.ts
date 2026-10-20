import {
  authorizeGuild,
  guildIdFromPath,
  loadGuildRoles,
  sendUpstreamError,
} from '../../../_lib/dashboard.js'
import { getRequestUrl, methodNotAllowed, sendError, sendJson } from '../../../_lib/http.js'
import { withRateLimit } from '../../../_lib/rateLimit.js'
import { readSession } from '../../../_lib/session.js'

export default withRateLimit('dashboard_roles', 120, 60_000, async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const session = readSession(req)
  if (!session) return sendError(res, 401, 'unauthenticated', 'No active session.')

  const { path } = getRequestUrl(req)
  const guildId = guildIdFromPath(path)
  if (!guildId) return sendError(res, 404, 'not_found', 'Unknown route.')

  const access = await authorizeGuild(session, res, guildId)
  if (!access) return

  try {
    const roles = await loadGuildRoles(guildId)
    const list = roles.map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color ?? 0,
      position: role.position ?? 0,
      managed: role.managed ?? false,
      mentionable: role.mentionable ?? false,
    }))

    sendJson(res, 200, { roles: list })
  } catch (error) {
    sendUpstreamError(res, error)
  }
})
