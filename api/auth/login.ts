import { siteOrigin } from '../_lib/env.js'
import {
  discordClientId,
  discordRedirectUri,
} from '../_lib/discord.js'
import { getRequestUrl, methodNotAllowed, sendError } from '../_lib/http.js'
import { withRateLimit } from '../_lib/rateLimit.js'
import { safeNextPath, rememberNextPath } from '../_lib/redirect.js'
import { createOAuthState, sessionSecret } from '../_lib/session.js'

const SCOPES = ['identify', 'guilds']

export default withRateLimit('auth_login', 20, 60_000, (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const clientId = discordClientId()
  const origin = siteOrigin(req)
  const redirectUri = discordRedirectUri(origin)

  if (!clientId || !redirectUri || !sessionSecret() || !origin) {
    return sendError(
      res,
      503,
      'oauth_not_configured',
      'Discord sign-in is not configured for this deployment. Set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, SESSION_SECRET and SITE_URL.',
    )
  }

  const { query } = getRequestUrl(req)
  const next = safeNextPath(query.get('next'))
  if (next) rememberNextPath(res, next)

  const state = createOAuthState(res)
  const url = new URL('https://discord.com/oauth2/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES.join(' '))
  url.searchParams.set('state', state)

  res.writeHead(302, { location: url.toString(), 'cache-control': 'no-store' })
  res.end()
})
