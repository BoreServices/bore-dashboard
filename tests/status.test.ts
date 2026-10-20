import { describe, expect, it } from 'vitest'
import { deriveOverallStatus, isStale, resolveUptimeSeconds, summarizeShards } from '../src/lib/status'
import type { Shard } from '../src/types/api'

const shard = (overrides: Partial<Shard> = {}): Shard => ({
  shardId: 0,
  isReady: true,
  serverCount: 10,
  cachedUserCount: 100,
  uptime: 1_700_000_000,
  latency: 42,
  ...overrides,
})

describe('status derivation', () => {
  it('reports unknown when there is no shard data', () => {
    expect(deriveOverallStatus(undefined)).toBe('unknown')
    expect(deriveOverallStatus([])).toBe('unknown')
  })

  it('reports operational when every shard is ready', () => {
    expect(deriveOverallStatus([shard(), shard({ shardId: 1 })])).toBe('operational')
  })

  it('reports degraded when only some shards are ready', () => {
    expect(deriveOverallStatus([shard(), shard({ shardId: 1, isReady: false })])).toBe('degraded')
  })

  it('reports down when no shard is ready', () => {
    expect(deriveOverallStatus([shard({ isReady: false })])).toBe('down')
  })

  it('summarises servers, cached users and latency', () => {
    const summary = summarizeShards([shard(), shard({ shardId: 1, serverCount: 5, cachedUserCount: 50, latency: 60 })])
    expect(summary.shards).toBe(2)
    expect(summary.ready).toBe(2)
    expect(summary.servers).toBe(15)
    expect(summary.cachedUsers).toBe(150)
    expect(summary.averageLatency).toBe(51)
    expect(summary.highestLatency).toBe(60)
  })
})

describe('uptime handling', () => {
  it('treats the bot uptime value as an epoch timestamp', () => {
    const now = 1_700_000_500_000
    expect(resolveUptimeSeconds(1_700_000_000, now)).toBe(500)
  })

  it('accepts a duration when the payload already contains one', () => {
    expect(resolveUptimeSeconds(3600)).toBe(3600)
  })

  it('returns zero for missing or invalid values', () => {
    expect(resolveUptimeSeconds(0)).toBe(0)
    expect(resolveUptimeSeconds(undefined)).toBe(0)
  })
})

describe('staleness', () => {
  it('marks data older than thirty seconds as stale', () => {
    const now = 1_000_000
    expect(isStale(now - 5_000, now)).toBe(false)
    expect(isStale(now - 45_000, now)).toBe(true)
    expect(isStale(null, now)).toBe(true)
  })
})
