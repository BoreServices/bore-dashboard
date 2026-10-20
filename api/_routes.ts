import type { ApiHandler } from './_lib/http.js'
import commands from './commands.js'
import status from './status.js'
import stats from './stats.js'
import shards from './shards.js'
import login from './auth/login.js'
import callback from './auth/callback.js'
import logout from './auth/logout.js'
import session from './auth/session.js'
import guild from './dashboard/guild.js'

/**
 * Route table shared by the Vercel filesystem routing and the Vite dev
 * middleware, so `npm run dev` behaves like the deployed site.
 */
export const routes: Record<string, ApiHandler> = {
  '/api/commands': commands,
  '/api/status': status,
  '/api/stats': stats,
  '/api/shards': shards,
  '/api/auth/login': login,
  '/api/auth/callback': callback,
  '/api/auth/logout': logout,
  '/api/auth/session': session,
  '/api/dashboard/guild': guild,
}
