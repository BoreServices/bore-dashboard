import { methodNotAllowed, sendError, sendJson } from '../_lib/http.js'
import { getUserGuilds } from '../_lib/guilds.js'
import { readSession } from '../_lib/session.js'

export default async function handler(
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
): Promise<void> {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const session = readSession(req)
  if (!session) {
    return sendError(res, 401, 'unauthenticated', 'No active session.')
  }

  let guilds: Awaited<ReturnType<typeof getUserGuilds>> = []
  let guildsAvailable = true
  try {
    guilds = await getUserGuilds(session.accessToken)
  } catch {
    // Discord may be unreachable or the token may have expired — the rest of
    // the session is still valid, so report the guild list as unavailable.
    guildsAvailable = false
  }

  sendJson(res, 200, {
    user: session.user,
    guilds,
    guildsAvailable,
    expiresAt: new Date(session.exp * 1000).toISOString(),
  })
}
