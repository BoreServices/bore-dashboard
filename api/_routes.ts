import type { ApiHandler } from './_lib/http.js'
import commands from './commands.js'
import status from './status.js'
import stats from './stats.js'
import shards from './shards.js'
import login from './auth/login.js'
import callback from './auth/callback.js'
import logout from './auth/logout.js'
import me from './auth/me.js'
import guild from './dashboard/guild.js'
import guilds from './dashboard/guilds.js'
import guildChannels from './dashboard/guilds/[guildId]/channels.js'
import guildRoles from './dashboard/guilds/[guildId]/roles.js'
import guildConfig from './dashboard/guilds/[guildId]/config.js'
import guildConfigModule from './dashboard/guilds/[guildId]/config/[module].js'

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
  '/api/auth/me': me,
  '/api/dashboard/guild': guild,
  '/api/dashboard/guilds': guilds,
}

/**
 * Vercel resolves the `[guildId]` and `[module]` segments from the file
 * system, while the dev middleware looks a route up by its path — so the
 * dynamic paths are matched here.
 */
const dynamicRoutes: Array<{ pattern: RegExp; handler: ApiHandler }> = [
  { pattern: /^\/api\/dashboard\/guilds\/[^/]+\/channels$/, handler: guildChannels },
  { pattern: /^\/api\/dashboard\/guilds\/[^/]+\/roles$/, handler: guildRoles },
  { pattern: /^\/api\/dashboard\/guilds\/[^/]+\/config$/, handler: guildConfig },
  {
    pattern: /^\/api\/dashboard\/guilds\/[^/]+\/config\/[^/]+$/,
    handler: guildConfigModule,
  },
]

export function matchRoute(path: string): ApiHandler | undefined {
  const staticHandler = routes[path]
  if (staticHandler) return staticHandler
  return dynamicRoutes.find((route) => route.pattern.test(path))?.handler
}
