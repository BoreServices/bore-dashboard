import { getUserGuilds } from '../_lib/guilds.js'
import { methodNotAllowed, sendError, sendJson } from '../_lib/http.js'
import { withRateLimit } from '../_lib/rateLimit.js'
import { readSession } from '../_lib/session.js'

export default withRateLimit('auth_me', 120, 60_000, async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const session = readSession(req)
  if (!session) return sendError(res, 401, 'unauthenticated', 'No active session.')

  let guildsAvailable = true
  try {
    await getUserGuilds(session.accessToken)
  } catch {
    // Discord may be unreachable or the token may have expired — the session
    // itself is still valid, so the guild list is reported as unavailable.
    guildsAvailable = false
  }

  sendJson(res, 200, {
    user: session.user,
    guildsAvailable,
  })
})
