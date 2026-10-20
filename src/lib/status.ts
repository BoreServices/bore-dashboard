import type { Shard } from '../types/api'

export type OverallStatus = 'operational' | 'degraded' | 'down' | 'unknown'

export const STATUS_META: Record<
  OverallStatus,
  { label: string; description: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  operational: {
    label: 'Operational',
    description:
      'Every reported shard is ready. The bot reports readiness as "not currently rate limited by Discord".',
    tone: 'success',
  },
  degraded: {
    label: 'Degraded',
    description:
      'Some shards are not ready — they are currently rate limited by Discord. Commands in those servers may fail.',
    tone: 'warning',
  },
  down: {
    label: 'Unavailable',
    description: 'No shard is ready, so the bot is not accepting commands.',
    tone: 'danger',
  },
  unknown: {
    label: 'Unknown',
    description: 'The status of the bot could not be verified right now.',
    tone: 'neutral',
  },
}

export function deriveOverallStatus(shards: Shard[] | undefined): OverallStatus {
  if (!shards || shards.length === 0) return 'unknown'
  const ready = shards.filter((shard) => shard.isReady).length
  if (ready === shards.length) return 'operational'
  if (ready === 0) return 'down'
  return 'degraded'
}

export type ShardSummary = {
  shards: number
  ready: number
  servers: number
  cachedUsers: number
  averageLatency: number
  highestLatency: number
  uptime: number
}

export function summarizeShards(shards: Shard[] | undefined): ShardSummary {
  const list = shards ?? []
  const latencies = list.map((shard) => shard.latency).filter((value) => Number.isFinite(value))
  const totalLatency = latencies.reduce((sum, value) => sum + value, 0)
  return {
    shards: list.length,
    ready: list.filter((shard) => shard.isReady).length,
    servers: list.reduce((sum, shard) => sum + shard.serverCount, 0),
    cachedUsers: list.reduce((sum, shard) => sum + shard.cachedUserCount, 0),
    averageLatency: latencies.length ? totalLatency / latencies.length : 0,
    highestLatency: latencies.length ? Math.max(...latencies) : 0,
    uptime: list[0]?.uptime ?? 0,
  }
}

/** Data older than this is no longer a verified view of the bot. */
export const STALE_AFTER_MS = 30_000

export function isStale(lastUpdated: number | null, now = Date.now()): boolean {
  if (!lastUpdated) return true
  return now - lastUpdated > STALE_AFTER_MS
}

/**
 * The bot API reports `bot._uptime`, which the bot sets to `time.time()` at
 * start-up — an epoch timestamp rather than a duration. Older or patched
 * payloads may contain a duration instead, so both are accepted.
 */
export function resolveUptimeSeconds(value: number | undefined, now = Date.now()): number {
  if (!value || !Number.isFinite(value) || value <= 0) return 0
  if (value > 1_000_000_000) return Math.max(0, Math.round(now / 1000 - value))
  return Math.round(value)
}
