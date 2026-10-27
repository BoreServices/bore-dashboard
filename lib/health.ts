import { API_BASE } from '@/lib/api'

interface BoreShard {
  shard_id: number
  is_ready: boolean
  server_count: number
  cached_user_count: number
  uptime: number
  latency: number // ms
}

const cache = { data: null as unknown, ts: 0 }
const TTL = 15_000

export async function getEliraShapeHealth(): Promise<unknown> {
  if (cache.data && Date.now() - cache.ts < TTL) return cache.data

  const [statsRes, statusRes] = await Promise.all([
    fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(5000), cache: 'no-store' }),
    fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(5000), cache: 'no-store' }),
  ])
  const stats = (await statsRes.json()) as { servers: number; members: number }
  const { shards } = (await statusRes.json()) as { shards: BoreShard[] }

  const eliraShards = shards.map((s) => ({
    id: s.shard_id,
    guilds: s.server_count,
    users: s.cached_user_count,
    uptime: s.uptime,
    latency: s.latency / 1000, // dashboard converts back to ms
  }))

  const cluster = {
    alive: shards.length > 0 && shards.every((s) => s.is_ready),
    guilds: stats.servers,
    users: stats.members,
    uptime: shards[0]?.uptime ?? 0,
    shards: eliraShards,
  }

  const body = {
    guilds: stats.servers,
    users: stats.members,
    clusters: { '0': cluster },
    system: { guilds: stats.servers, users: stats.members, clusters: { '0': cluster } },
  }

  cache.data = body
  cache.ts = Date.now()
  return body
}
