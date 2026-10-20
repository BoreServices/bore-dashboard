import { botStatsSchema } from './_lib/bot.js'
import { botProxyHandler } from './_lib/proxy.js'
import { withRateLimit } from './_lib/rateLimit.js'

export default withRateLimit(
  'stats',
  240,
  60_000,
  botProxyHandler('/stats', botStatsSchema),
)
