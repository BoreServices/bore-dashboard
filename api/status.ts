import { botStatusSchema } from './_lib/bot.js'
import { botProxyHandler } from './_lib/proxy.js'
import { withRateLimit } from './_lib/rateLimit.js'

export default withRateLimit(
  'status',
  240,
  60_000,
  botProxyHandler('/status', botStatusSchema, (payload) => ({
    shards: payload.shards.map((shard) => ({
      shardId: shard.shard_id,
      isReady: shard.is_ready,
      serverCount: shard.server_count,
      cachedUserCount: shard.cached_user_count,
      uptime: shard.uptime,
      latency: shard.latency,
    })),
  })),
)
