import pg from 'pg'
import { env } from './env.js'

/**
 * The bot stores its per-guild prefix in the `prefix` table (see
 * base/schema/schema.sql). The website only ever reads that single row, and
 * only for a guild the signed-in user actually belongs to.
 */
type GlobalWithPool = typeof globalThis & { __borePool?: pg.Pool }

const globalWithPool = globalThis as GlobalWithPool

export function databaseConfigured(): boolean {
  return Boolean(env('DATABASE_URL'))
}

export function getPool(): pg.Pool | null {
  const connectionString = env('DATABASE_URL')
  if (!connectionString) return null

  if (!globalWithPool.__borePool) {
    globalWithPool.__borePool = new pg.Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      query_timeout: 5_000,
    })
    globalWithPool.__borePool.on('error', () => {
      // A broken idle connection must not crash the function instance.
    })
  }
  return globalWithPool.__borePool
}

export async function fetchGuildPrefix(guildId: string): Promise<string | null> {
  const pool = getPool()
  if (!pool) return null
  const result = await pool.query<{ prefix: string | null }>(
    'SELECT prefix FROM prefix WHERE guild_id = $1',
    [guildId],
  )
  return result.rows[0]?.prefix ?? null
}
