import pg from 'pg'
import { env } from './env.js'

/**
 * The bot stores its per-guild configuration in the tables created by
 * base/schema/schema.sql. The website only ever reads and writes those
 * existing rows, and only for a guild the signed-in user actually belongs to.
 */
type GlobalWithPool = typeof globalThis & { __borePool?: pg.Pool }

const globalWithPool = globalThis as GlobalWithPool

export class DatabaseUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'DatabaseUnavailableError'
  }
}

/**
 * The `aliases` table in an older database uses `name`/`invoke` instead of the
 * `alias` column the bot's own code expects. The dashboard reports that
 * mismatch instead of writing rows the bot would never read.
 */
export class SchemaMismatchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaMismatchError'
  }
}

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

/**
 * Every statement is parameterised and funnelled through here so a missing
 * or broken database always surfaces as one error type.
 */
async function query<T extends pg.QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const pool = getPool()
  if (!pool) {
    throw new DatabaseUnavailableError('DATABASE_URL is not configured.')
  }
  try {
    const result = await pool.query<T>(text, values)
    return result.rows
  } catch (error) {
    throw new DatabaseUnavailableError('The database could not be reached.', {
      cause: error,
    })
  }
}

export type ChannelMessageRow = { channel_id: string; message: string }
export type AutoroleRow = { role_id: string }
export type AliasRow = { alias: string; command: string }
export type AntinukeGuildRow = {
  enabled: boolean
  log_channel_id: string | null
  window_seconds: number
}
export type AntinukeSettingRow = {
  module: string
  punishment: string
  threshold: number
}
export type HoneypotSettingsRow = {
  staff_role_id: string | null
  log_channel_id: string | null
  jail_role_id: string | null
}
export type HoneypotRow = { channel_id: string; punishment: string }

/** The three tables that hold a per-channel message. */
const MESSAGE_TABLES = {
  welcome: 'welcome',
  leave: 'leave',
  boost: 'boost',
} as const

export type MessageTable = keyof typeof MESSAGE_TABLES

const HONEYPOT_SETTING_COLUMNS = [
  'staff_role_id',
  'log_channel_id',
  'jail_role_id',
] as const

export type HoneypotSettingColumn = (typeof HONEYPOT_SETTING_COLUMNS)[number]

/* -------------------------------------------------------------------------- */
/* prefix                                                                     */
/* -------------------------------------------------------------------------- */

export async function fetchGuildPrefix(guildId: string): Promise<string | null> {
  const rows = await query<{ prefix: string | null }>(
    'SELECT prefix FROM prefix WHERE guild_id = $1',
    [guildId],
  )
  return rows[0]?.prefix ?? null
}

export async function setGuildPrefix(guildId: string, prefix: string): Promise<void> {
  await query(
    'INSERT INTO prefix (guild_id, prefix) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET prefix = EXCLUDED.prefix',
    [guildId, prefix],
  )
}

export async function clearGuildPrefix(guildId: string): Promise<void> {
  await query('DELETE FROM prefix WHERE guild_id = $1', [guildId])
}

/* -------------------------------------------------------------------------- */
/* welcome / leave / boost                                                    */
/* -------------------------------------------------------------------------- */

export async function fetchChannelMessages(
  guildId: string,
  table: MessageTable,
): Promise<ChannelMessageRow[]> {
  const rows = await query<ChannelMessageRow>(
    `SELECT channel_id, message FROM ${MESSAGE_TABLES[table]} WHERE guild_id = $1`,
    [guildId],
  )
  return rows
}

/**
 * `welcome` and `boost` have no unique constraint on (guild_id, channel_id),
 * so an existing row is updated instead of inserting a duplicate.
 */
export async function upsertChannelMessage(
  guildId: string,
  table: MessageTable,
  channelId: string,
  message: string,
): Promise<void> {
  const name = MESSAGE_TABLES[table]
  const existing = await query<{ channel_id: string }>(
    `SELECT channel_id FROM ${name} WHERE guild_id = $1 AND channel_id = $2`,
    [guildId, channelId],
  )
  if (existing.length) {
    await query(
      `UPDATE ${name} SET message = $1 WHERE guild_id = $2 AND channel_id = $3`,
      [message, guildId, channelId],
    )
    return
  }
  await query(
    `INSERT INTO ${name} (guild_id, channel_id, message) VALUES ($1, $2, $3)`,
    [guildId, channelId, message],
  )
}

export async function deleteChannelMessage(
  guildId: string,
  table: MessageTable,
  channelId: string,
): Promise<void> {
  await query(
    `DELETE FROM ${MESSAGE_TABLES[table]} WHERE guild_id = $1 AND channel_id = $2`,
    [guildId, channelId],
  )
}

/* -------------------------------------------------------------------------- */
/* autorole                                                                   */
/* -------------------------------------------------------------------------- */

export async function fetchAutoroles(guildId: string): Promise<AutoroleRow[]> {
  return query<AutoroleRow>('SELECT role_id FROM autorole WHERE guild_id = $1', [
    guildId,
  ])
}

export async function addAutorole(guildId: string, roleId: string): Promise<void> {
  await query(
    'INSERT INTO autorole (guild_id, role_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM autorole WHERE guild_id = $1 AND role_id = $2)',
    [guildId, roleId],
  )
}

export async function deleteAutorole(guildId: string, roleId: string): Promise<void> {
  await query('DELETE FROM autorole WHERE guild_id = $1 AND role_id = $2', [
    guildId,
    roleId,
  ])
}

/* -------------------------------------------------------------------------- */
/* aliases                                                                    */
/* -------------------------------------------------------------------------- */

let aliasesLayout: 'current' | 'legacy' | null = null

/**
 * Detects which column layout the `aliases` table uses. The bot's code (and
 * base/schema/schema.sql) expect `alias`; an older database still has `name`.
 */
export async function detectAliasesLayout(): Promise<'current' | 'legacy'> {
  if (aliasesLayout) return aliasesLayout
  const rows = await query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'aliases'`,
  )
  const columns = new Set(rows.map((row) => row.column_name))
  aliasesLayout = columns.has('alias') ? 'current' : 'legacy'
  return aliasesLayout
}

export async function fetchAliases(guildId: string): Promise<AliasRow[]> {
  if ((await detectAliasesLayout()) !== 'current') {
    // The legacy rows are keyed by `name` and cannot be executed by the bot
    // either, so they are not shown as aliases.
    return []
  }
  return query<AliasRow>(
    'SELECT alias, command FROM aliases WHERE guild_id = $1 ORDER BY alias',
    [guildId],
  )
}

export async function upsertAlias(
  guildId: string,
  alias: string,
  command: string,
): Promise<void> {
  if ((await detectAliasesLayout()) !== 'current') {
    throw new SchemaMismatchError(
      'The aliases table in this database still uses the old name/invoke layout. Apply migrations/001_aliases_columns.sql to enable alias management.',
    )
  }
  await query(
    'INSERT INTO aliases (guild_id, alias, command) VALUES ($1, $2, $3) ON CONFLICT (guild_id, alias) DO UPDATE SET command = EXCLUDED.command',
    [guildId, alias, command],
  )
}

export async function deleteAlias(guildId: string, alias: string): Promise<void> {
  if ((await detectAliasesLayout()) !== 'current') {
    throw new SchemaMismatchError(
      'The aliases table in this database still uses the old name/invoke layout. Apply migrations/001_aliases_columns.sql to enable alias management.',
    )
  }
  await query('DELETE FROM aliases WHERE guild_id = $1 AND alias = $2', [guildId, alias])
}

/* -------------------------------------------------------------------------- */
/* antinuke                                                                   */
/* -------------------------------------------------------------------------- */

export async function fetchAntinukeGuild(
  guildId: string,
): Promise<AntinukeGuildRow | null> {
  const rows = await query<AntinukeGuildRow>(
    'SELECT enabled, log_channel_id, window_seconds FROM antinuke_guild WHERE guild_id = $1',
    [guildId],
  )
  return rows[0] ?? null
}

export async function fetchAntinukeSettings(
  guildId: string,
): Promise<AntinukeSettingRow[]> {
  return query<AntinukeSettingRow>(
    'SELECT module, punishment, threshold FROM antinuke_settings WHERE guild_id = $1',
    [guildId],
  )
}

export async function setAntinukeEnabled(
  guildId: string,
  enabled: boolean,
): Promise<void> {
  await query(
    'INSERT INTO antinuke_guild (guild_id, enabled) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET enabled = EXCLUDED.enabled',
    [guildId, enabled],
  )
}

export async function setAntinukeLogChannel(
  guildId: string,
  channelId: string | null,
): Promise<void> {
  await query(
    'INSERT INTO antinuke_guild (guild_id, log_channel_id) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET log_channel_id = EXCLUDED.log_channel_id',
    [guildId, channelId],
  )
}

export async function setAntinukeWindow(
  guildId: string,
  seconds: number,
): Promise<void> {
  await query(
    'INSERT INTO antinuke_guild (guild_id, window_seconds) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET window_seconds = EXCLUDED.window_seconds',
    [guildId, seconds],
  )
}

export async function upsertAntinukeModule(
  guildId: string,
  module: string,
  punishment: string,
  threshold: number,
): Promise<void> {
  await query(
    'INSERT INTO antinuke_settings (guild_id, module, punishment, threshold) VALUES ($1, $2, $3, $4) ON CONFLICT (guild_id, module) DO UPDATE SET punishment = EXCLUDED.punishment, threshold = EXCLUDED.threshold',
    [guildId, module, punishment, threshold],
  )
}

export async function deleteAntinukeModule(
  guildId: string,
  module: string,
): Promise<void> {
  await query('DELETE FROM antinuke_settings WHERE guild_id = $1 AND module = $2', [
    guildId,
    module,
  ])
}

/* -------------------------------------------------------------------------- */
/* honeypot                                                                   */
/* -------------------------------------------------------------------------- */

export async function fetchHoneypotSettings(
  guildId: string,
): Promise<HoneypotSettingsRow | null> {
  const rows = await query<HoneypotSettingsRow>(
    'SELECT staff_role_id, log_channel_id, jail_role_id FROM honeypot_settings WHERE guild_id = $1',
    [guildId],
  )
  return rows[0] ?? null
}

export async function fetchHoneypots(guildId: string): Promise<HoneypotRow[]> {
  return query<HoneypotRow>(
    'SELECT channel_id, punishment FROM honeypots WHERE guild_id = $1 ORDER BY channel_id',
    [guildId],
  )
}

export async function setHoneypotSetting(
  guildId: string,
  column: HoneypotSettingColumn,
  value: string | null,
): Promise<void> {
  if (!HONEYPOT_SETTING_COLUMNS.includes(column)) {
    throw new Error('Unsupported honeypot setting')
  }
  await query(
    `INSERT INTO honeypot_settings (guild_id, ${column}) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET ${column} = EXCLUDED.${column}`,
    [guildId, value],
  )
}

export async function upsertHoneypot(
  guildId: string,
  channelId: string,
  punishment: string,
): Promise<void> {
  await query(
    'INSERT INTO honeypots (guild_id, channel_id, punishment) VALUES ($1, $2, $3) ON CONFLICT (guild_id, channel_id) DO UPDATE SET punishment = EXCLUDED.punishment',
    [guildId, channelId, punishment],
  )
}

export async function deleteHoneypot(
  guildId: string,
  channelId: string,
): Promise<void> {
  await query('DELETE FROM honeypots WHERE guild_id = $1 AND channel_id = $2', [
    guildId,
    channelId,
  ])
}
