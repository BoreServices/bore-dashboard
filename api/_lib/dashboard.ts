import { z } from 'zod'
import type { ServerResponse } from 'node:http'
import {
  BotApiError,
  BotNotInGuildError,
  botCommandsSchema,
  fetchBotApi,
  fetchBotGuildChannels,
  fetchBotGuildRoles,
} from './bot.js'
import type { BotChannel, BotRole } from './bot.js'
import {
  DatabaseUnavailableError,
  SchemaMismatchError,
  addAutorole,
  clearGuildPrefix,
  deleteAlias,
  deleteAntinukeModule,
  deleteAutorole,
  deleteChannelMessage,
  deleteHoneypot,
  fetchAliases,
  fetchAntinukeGuild,
  fetchAntinukeSettings,
  fetchAutoroles,
  fetchChannelMessages,
  fetchGuildPrefix,
  fetchHoneypotSettings,
  fetchHoneypots,
  setAntinukeEnabled,
  setAntinukeLogChannel,
  setAntinukeWindow,
  setGuildPrefix,
  setHoneypotSetting,
  upsertAlias,
  upsertAntinukeModule,
  upsertChannelMessage,
  upsertHoneypot,
} from './db.js'
import type { MessageTable } from './db.js'
import { DiscordApiError } from './discord.js'
import { getGuildPermissions, getUserGuilds } from './guilds.js'
import { sendError } from './http.js'
import { hasPermission } from './permissions.js'
import type { PermissionName } from './permissions.js'
import type { SessionGuild, SessionPayload } from './session.js'

/** The configuration modules the dashboard can read and write. */
export const CONFIG_MODULES = [
  'prefix',
  'welcome',
  'leave',
  'boost',
  'autoroles',
  'aliases',
  'antinuke',
  'honeypot',
] as const

export type ConfigModule = (typeof CONFIG_MODULES)[number]

/** The permission each module needs, matching the bot's own command checks. */
export const MODULE_PERMISSIONS: Record<ConfigModule, PermissionName> = {
  prefix: 'manage_messages',
  welcome: 'manage_messages',
  leave: 'manage_messages',
  boost: 'manage_messages',
  autoroles: 'manage_roles',
  aliases: 'manage_guild',
  antinuke: 'manage_guild',
  honeypot: 'administrator',
}

/** The anti-nuke modules, exactly as the cog knows them. */
export const ANTINUKE_MODULES = [
  'ban',
  'kick',
  'role',
  'rolecreate',
  'channel',
  'emoji',
  'webhook',
  'invite',
  'botadd',
  'prune',
  'vanity',
  'guild',
] as const

export type AntinukeModule = (typeof ANTINUKE_MODULES)[number]

/** These punish on the very first action, so their threshold is always 1. */
export const ANTINUKE_INSTANT_MODULES: readonly AntinukeModule[] = [
  'botadd',
  'prune',
  'vanity',
  'guild',
]

export const ANTINUKE_PUNISHMENTS = [
  'ban',
  'kick',
  'stripstaff',
  'kickstripstaff',
] as const

export const HONEYPOT_PUNISHMENTS = ['ban', 'softban', 'jail'] as const

const snowflake = z.string().regex(/^\d{1,20}$/, 'Expected a Discord id.')

export const prefixBodySchema = z.object({
  prefix: z
    .string()
    .min(1)
    .max(7)
    .regex(/^\S+$/, 'The prefix cannot contain whitespace.')
    .nullable(),
})

export const messageBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('upsert'),
    channelId: snowflake,
    message: z.string().min(1).max(4000),
  }),
  z.object({
    action: z.literal('delete'),
    channelId: snowflake,
  }),
])

export const autoroleBodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add'), roleId: snowflake }),
  z.object({ action: z.literal('delete'), roleId: snowflake }),
])

export const aliasBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    alias: z.string().min(1).max(64),
    command: z.string().min(1).max(64),
  }),
  z.object({
    action: z.literal('delete'),
    alias: z.string().min(1).max(64),
  }),
])

const antinukeModuleBodySchema = z.union([
  z.object({ module: z.enum(ANTINUKE_MODULES), enabled: z.literal(false) }),
  z.object({
    module: z.enum(ANTINUKE_MODULES),
    enabled: z.literal(true).optional(),
    punishment: z.enum(ANTINUKE_PUNISHMENTS),
    threshold: z.number().int().min(1).max(25),
  }),
])

export const antinukeBodySchema = z.object({
  enabled: z.boolean().optional(),
  logChannelId: snowflake.nullable().optional(),
  windowSeconds: z.number().int().min(1).max(60).optional(),
  modules: z.array(antinukeModuleBodySchema).optional(),
})

export const honeypotBodySchema = z
  .object({
    staffRoleId: snowflake.nullable().optional(),
    logChannelId: snowflake.nullable().optional(),
    jailRoleId: snowflake.nullable().optional(),
    action: z.enum(['add', 'remove']).optional(),
    channelId: snowflake.optional(),
    punishment: z.enum(HONEYPOT_PUNISHMENTS).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'add' && !value.punishment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['punishment'],
        message: 'A punishment is required when adding a honeypot channel.',
      })
    }
    if (value.action && !value.channelId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['channelId'],
        message: 'A channel is required.',
      })
    }
    const settings =
      value.staffRoleId !== undefined ||
      value.logChannelId !== undefined ||
      value.jailRoleId !== undefined
    if (!value.action && !settings) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Nothing to update.',
      })
    }
  })

export const moduleBodySchemas = {
  prefix: prefixBodySchema,
  welcome: messageBodySchema,
  leave: messageBodySchema,
  boost: messageBodySchema,
  autoroles: autoroleBodySchema,
  aliases: aliasBodySchema,
  antinuke: antinukeBodySchema,
  honeypot: honeypotBodySchema,
} as const

export type ChannelMessageConfig = {
  channelId: string
  channelName: string | null
  message: string
}

export type AutoroleConfig = { roleId: string; roleName: string | null }

export type AliasConfig = { alias: string; command: string }

export type AntinukeConfig = {
  enabled: boolean
  logChannelId: string | null
  windowSeconds: number
  modules: Array<{ module: string; punishment: string; threshold: number }>
}

export type HoneypotConfig = {
  staffRoleId: string | null
  logChannelId: string | null
  jailRoleId: string | null
  channels: Array<{
    channelId: string
    channelName: string | null
    punishment: string
  }>
}

export type GuildSummary = {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
  botInstalled: boolean | null
}

export type GuildAccess = {
  guild: SessionGuild
  permissions: string
  accessToken: string
}

/** The alias is lowercased and stripped of spaces, exactly like the bot does. */
export function normalizeAlias(value: string): string {
  return value.toLowerCase().replace(/ /g, '')
}

/** A request that cannot be applied to the guild, such as a foreign id. */
export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidRequestError'
  }
}

export function isConfigModule(value: string): value is ConfigModule {
  return (CONFIG_MODULES as readonly string[]).includes(value)
}

/** The bot's default threshold when a row does not carry one. */
export function antinukeThreshold(module: string, threshold: number): number {
  const clamped = Math.min(Math.max(threshold, 1), 25)
  return (ANTINUKE_INSTANT_MODULES as readonly string[]).includes(module) ? 1 : clamped
}

/** Extracts the guild id out of a dashboard path. */
export function guildIdFromPath(path: string): string | null {
  const match = /^\/api\/dashboard\/guilds\/(\d{1,20})(\/|$)/.exec(path)
  return match ? match[1] : null
}

/** Extracts the configuration module out of a dashboard path. */
export function moduleFromPath(path: string): string | null {
  const match = /^\/api\/dashboard\/guilds\/\d{1,20}\/config\/([^/]+)\/?$/.exec(path)
  return match ? match[1] : null
}

export type GuildDirectory = {
  channels: Map<string, string>
  roles: Map<string, string>
  /** False when Bore is not installed, so no channel or role can be resolved. */
  available: boolean
}

/**
 * Channels and roles are read through the bot API: Discord removed the
 * user-token channel and role endpoints, so the signed-in user's OAuth token
 * cannot list them. The bot API holds the bot token.
 */
export async function loadGuildChannels(guildId: string): Promise<BotChannel[]> {
  return fetchBotGuildChannels(guildId)
}

export async function loadGuildRoles(guildId: string): Promise<{
  roles: BotRole[]
  botRolePosition: number
}> {
  const payload = await fetchBotGuildRoles(guildId)
  return { roles: payload.roles, botRolePosition: payload.bot_role_position }
}

/** The same lists, but tolerant of a server the bot is not installed in. */
export async function readGuildDirectory(guildId: string): Promise<GuildDirectory> {
  try {
    const [channels, { roles }] = await Promise.all([
      loadGuildChannels(guildId),
      loadGuildRoles(guildId),
    ])
    return {
      channels: new Map(channels.map((channel) => [channel.id, channel.name])),
      roles: new Map(roles.map((role) => [role.id, role.name])),
      available: true,
    }
  } catch (error) {
    if (error instanceof BotNotInGuildError) {
      return { channels: new Map(), roles: new Map(), available: false }
    }
    throw error
  }
}

/**
 * Possession of a guild id is never proof of access: the guild has to be one
 * of the signed-in user's own guilds, and the write permission is checked
 * against the bitfield Discord reports for that guild.
 */
export async function authorizeGuild(
  session: SessionPayload,
  res: ServerResponse,
  guildId: string,
  required?: PermissionName,
): Promise<GuildAccess | null> {
  let guilds: SessionGuild[]
  try {
    guilds = await getUserGuilds(session.accessToken)
  } catch {
    sendError(res, 503, 'discord_unavailable', 'The guild list could not be verified.')
    return null
  }

  const guild = guilds.find((entry) => entry.id === guildId)
  if (!guild) {
    sendError(res, 403, 'forbidden', 'You do not manage this server.')
    return null
  }

  let permissions: string
  try {
    permissions = await getGuildPermissions(session.accessToken, guildId)
  } catch {
    sendError(
      res,
      502,
      'discord_error',
      'Your permissions in this server could not be read.',
    )
    return null
  }

  if (required && !hasPermission(permissions, required)) {
    sendError(
      res,
      403,
      'missing_permission',
      `You need the ${required} permission to change this setting.`,
      { required },
    )
    return null
  }

  return { guild, permissions, accessToken: session.accessToken }
}

/* -------------------------------------------------------------------------- */
/* Reading module values                                                      */
/* -------------------------------------------------------------------------- */

export async function readPrefixConfig(guildId: string): Promise<string | null> {
  return fetchGuildPrefix(guildId)
}

export async function readMessageConfig(
  guildId: string,
  table: MessageTable,
  channelNames: Map<string, string>,
): Promise<ChannelMessageConfig[]> {
  const rows = await fetchChannelMessages(guildId, table)
  return rows.map((row) => ({
    channelId: row.channel_id,
    channelName: channelNames.get(row.channel_id) ?? null,
    message: row.message,
  }))
}

export async function readAutoroleConfig(
  guildId: string,
  roleNames: Map<string, string>,
): Promise<AutoroleConfig[]> {
  const rows = await fetchAutoroles(guildId)
  return rows.map((row) => ({
    roleId: row.role_id,
    roleName: roleNames.get(row.role_id) ?? null,
  }))
}

export async function readAliasConfig(guildId: string): Promise<AliasConfig[]> {
  const rows = await fetchAliases(guildId)
  return rows.map((row) => ({ alias: row.alias, command: row.command }))
}

export async function readAntinukeConfig(guildId: string): Promise<AntinukeConfig> {
  const [guildRow, settings] = await Promise.all([
    fetchAntinukeGuild(guildId),
    fetchAntinukeSettings(guildId),
  ])

  return {
    enabled: guildRow?.enabled ?? true,
    logChannelId: guildRow?.log_channel_id ?? null,
    windowSeconds: guildRow?.window_seconds
      ? Math.min(guildRow.window_seconds, 60)
      : 10,
    modules: settings
      .filter((setting) =>
        (ANTINUKE_PUNISHMENTS as readonly string[]).includes(setting.punishment),
      )
      .map((setting) => ({
        module: setting.module,
        punishment: setting.punishment,
        threshold: antinukeThreshold(setting.module, setting.threshold ?? 3),
      })),
  }
}

export async function readHoneypotConfig(
  guildId: string,
  channelNames: Map<string, string>,
): Promise<HoneypotConfig> {
  const [settings, honeypots] = await Promise.all([
    fetchHoneypotSettings(guildId),
    fetchHoneypots(guildId),
  ])

  return {
    staffRoleId: settings?.staff_role_id ?? null,
    logChannelId: settings?.log_channel_id ?? null,
    jailRoleId: settings?.jail_role_id ?? null,
    channels: honeypots.map((row) => ({
      channelId: row.channel_id,
      channelName: channelNames.get(row.channel_id) ?? null,
      punishment: row.punishment,
    })),
  }
}

/* -------------------------------------------------------------------------- */
/* Writing module values                                                      */
/* -------------------------------------------------------------------------- */

export async function writePrefixConfig(
  guildId: string,
  prefix: string | null,
): Promise<void> {
  if (prefix === null) {
    await clearGuildPrefix(guildId)
    return
  }
  await setGuildPrefix(guildId, prefix)
}

export async function writeMessageConfig(
  guildId: string,
  table: MessageTable,
  channelId: string,
  message: string | null,
): Promise<void> {
  if (message === null) {
    await deleteChannelMessage(guildId, table, channelId)
    return
  }
  await upsertChannelMessage(guildId, table, channelId, message)
}

export async function writeAutoroleConfig(
  guildId: string,
  roleId: string,
  add: boolean,
): Promise<void> {
  if (add) {
    await addAutorole(guildId, roleId)
    return
  }
  await deleteAutorole(guildId, roleId)
}

/** The command has to be one the bot actually knows about. */
export async function resolveCommandName(command: string): Promise<string | null> {
  const payload = await fetchBotApi('/commands', botCommandsSchema)
  const wanted = command.trim().toLowerCase()
  for (const commands of Object.values(payload)) {
    for (const entry of commands) {
      if (entry.name.toLowerCase() === wanted) return entry.name.toLowerCase()
    }
  }
  return null
}

export async function writeAliasConfig(
  guildId: string,
  alias: string,
  command: string | null,
): Promise<void> {
  if (command === null) {
    await deleteAlias(guildId, alias)
    return
  }
  await upsertAlias(guildId, alias, command)
}

export async function writeAntinukeConfig(
  guildId: string,
  body: z.infer<typeof antinukeBodySchema>,
): Promise<void> {
  if (body.enabled !== undefined) {
    await setAntinukeEnabled(guildId, body.enabled)
  }
  if (body.logChannelId !== undefined) {
    await setAntinukeLogChannel(guildId, body.logChannelId)
  }
  if (body.windowSeconds !== undefined) {
    await setAntinukeWindow(guildId, body.windowSeconds)
  }
  for (const entry of body.modules ?? []) {
    if (entry.enabled === false) {
      await deleteAntinukeModule(guildId, entry.module)
      continue
    }
    const threshold = antinukeThreshold(entry.module, entry.threshold)
    await upsertAntinukeModule(guildId, entry.module, entry.punishment, threshold)
  }
}

export async function writeHoneypotConfig(
  guildId: string,
  body: z.infer<typeof honeypotBodySchema>,
): Promise<void> {
  if (body.staffRoleId !== undefined) {
    await setHoneypotSetting(guildId, 'staff_role_id', body.staffRoleId)
  }
  if (body.logChannelId !== undefined) {
    await setHoneypotSetting(guildId, 'log_channel_id', body.logChannelId)
  }
  if (body.jailRoleId !== undefined) {
    await setHoneypotSetting(guildId, 'jail_role_id', body.jailRoleId)
  }
  if (body.action === 'add' && body.channelId && body.punishment) {
    await upsertHoneypot(guildId, body.channelId, body.punishment)
  }
  if (body.action === 'remove' && body.channelId) {
    await deleteHoneypot(guildId, body.channelId)
  }
}

/** One place to turn upstream failures into the documented error shapes. */
export function sendUpstreamError(res: ServerResponse, error: unknown): void {
  if (error instanceof InvalidRequestError) {
    sendError(res, 400, 'invalid_request', error.message)
    return
  }
  if (error instanceof SchemaMismatchError) {
    sendError(res, 409, 'schema_mismatch', error.message)
    return
  }
  if (error instanceof BotNotInGuildError) {
    sendError(res, 409, 'bot_not_installed', error.message)
    return
  }
  if (error instanceof DiscordApiError) {
    if (error.status === 401) {
      sendError(res, 401, 'unauthenticated', 'Your Discord session has expired.')
      return
    }
    sendError(res, 502, 'discord_error', error.message)
    return
  }
  if (error instanceof BotApiError) {
    sendError(res, 502, 'bot_api_unavailable', error.message)
    return
  }
  if (error instanceof DatabaseUnavailableError) {
    sendError(res, 503, 'database_unavailable', 'The database could not be reached.')
    return
  }
  if (error instanceof SchemaMismatchError) {
    sendError(res, 503, 'schema_mismatch', error.message)
    return
  }
  sendError(res, 500, 'internal_error', 'Unexpected server error.')
}
