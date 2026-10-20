import { methodNotAllowed, sendJson } from '../_lib/http.js'
import { clearCookie, SESSION_COOKIE } from '../_lib/session.js'
import { withRateLimit } from '../_lib/rateLimit.js'

export default withRateLimit('auth_logout', 30, 60_000, (req, res) => {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST'])
  }
  clearCookie(res, SESSION_COOKIE)
  sendJson(res, 200, { ok: true })
})
