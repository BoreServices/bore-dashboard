import { siteOrigin } from '../_lib/env.js'
import {
  avatarUrl,
  DiscordApiError,
  discordClientId,
  discordRedirectUri,
  exchangeCodeForToken,
  fetchCurrentUser,
} from '../_lib/discord.js'
import { getRequestUrl, methodNotAllowed, sendError } from '../_lib/http.js'
import { takeNextPath } from '../_lib/redirect.js'
import { consumeOAuthState, clearCookie, OAUTH_STATE_COOKIE, writeSession } from '../_lib/session.js'
import { withRateLimit } from '../_lib/rateLimit.js'

function redirect(res: import('node:http').ServerResponse, location: string): void {
  res.writeHead(302, { location, 'cache-control': 'no-store' })
  res.end()
}

export default withRateLimit('auth_callback', 30, 60_000, async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const { query } = getRequestUrl(req)
  const origin = siteOrigin(req)

  if (!origin) {
    return sendError(
      res,
      503,
      'site_url_not_configured',
      'SITE_URL is not configured for this deployment, so the sign-in redirect cannot be built.',
    )
  }

  const oauthError = query.get('error')
  if (oauthError) {
    const code = oauthError === 'access_denied' ? 'access_denied' : 'oauth_error'
    return redirect(res, `${origin}/auth/login?error=${encodeURIComponent(code)}`)
  }

  const code = query.get('code')
  const state = query.get('state')
  if (!code || !state) {
    return redirect(res, `${origin}/auth/login?error=${encodeURIComponent('missing_code')}`)
  }

  if (!consumeOAuthState(req, state)) {
    return redirect(res, `${origin}/auth/login?error=${encodeURIComponent('invalid_state')}`)
  }
  // The state is single use.
  clearCookie(res, OAUTH_STATE_COOKIE)

  const clientId = discordClientId()
  const redirectUri = discordRedirectUri(origin)
  if (!clientId || !redirectUri) {
    return redirect(res, `${origin}/auth/login?error=${encodeURIComponent('oauth_not_configured')}`)
  }

  try {
    const token = await exchangeCodeForToken(code, redirectUri)
    const user = await fetchCurrentUser(token.access_token)

    writeSession(res, {
      user: {
        id: user.id,
        username: user.username,
        globalName: user.global_name ?? null,
        avatar: avatarUrl(user.id, user.avatar ?? null),
      },
      accessToken: token.access_token,
    })

    return redirect(res, takeNextPath(req, res))
  } catch (error) {
    const code = error instanceof DiscordApiError ? error.code : 'oauth_failed'
    return redirect(res, `${origin}/auth/login?error=${encodeURIComponent(code)}`)
  }
})
