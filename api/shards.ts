import { botShardsSchema } from './_lib/bot.js'
import { botProxyHandler } from './_lib/proxy.js'
import { withRateLimit } from './_lib/rateLimit.js'

export default withRateLimit(
  'shards',
  120,
  60_000,
  botProxyHandler('/shards', botShardsSchema, (payload) => ({
    shards: Object.entries(payload).map(([shardId, guildIds]) => ({
      shardId: Number(shardId),
      guildIds,
    })),
  })),
)
