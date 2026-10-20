import { z } from 'zod'

export const dashboardGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  owner: z.boolean(),
  memberCount: z.number().nullable(),
  permissions: z.string(),
  botInstalled: z.boolean().nullable(),
  /** Installation link for this server, built from the Discord application id. */
  installUrl: z.string().nullable().optional(),
})

export const guildsResponseSchema = z.object({
  guilds: z.array(dashboardGuildSchema),
  fetchedAt: z.string(),
})

export const channelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.number(),
  parentId: z.string().nullable(),
  position: z.number(),
})

export const channelsResponseSchema = z.object({
  channels: z.array(channelSchema),
})

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.number(),
  position: z.number(),
  managed: z.boolean(),
  mentionable: z.boolean(),
})

export const rolesResponseSchema = z.object({
  roles: z.array(roleSchema),
  /** The highest role the bot holds; roles at or above it cannot be assigned. */
  botRolePosition: z.number(),
})

export const messageEntrySchema = z.object({
  channelId: z.string(),
  channelName: z.string().nullable(),
  message: z.string(),
})

export const antinukeModuleSchema = z.object({
  module: z.string(),
  punishment: z.string(),
  threshold: z.number(),
})

export const antinukeSchema = z.object({
  enabled: z.boolean(),
  logChannelId: z.string().nullable(),
  windowSeconds: z.number(),
  modules: z.array(antinukeModuleSchema),
})

export const honeypotChannelSchema = z.object({
  channelId: z.string(),
  channelName: z.string().nullable(),
  punishment: z.string(),
})

export const honeypotSchema = z.object({
  staffRoleId: z.string().nullable(),
  logChannelId: z.string().nullable(),
  jailRoleId: z.string().nullable(),
  channels: z.array(honeypotChannelSchema),
})

export const guildConfigSchema = z.object({
  guild: dashboardGuildSchema,
  prefix: z.string().nullable(),
  welcome: z.array(messageEntrySchema),
  leave: z.array(messageEntrySchema),
  boost: z.array(messageEntrySchema),
  autoroles: z.array(z.object({ roleId: z.string(), roleName: z.string().nullable() })),
  aliases: z.array(z.object({ alias: z.string(), command: z.string() })),
  antinuke: antinukeSchema,
  honeypot: honeypotSchema,
  warnings: z.array(z.string()).optional(),
  fetchedAt: z.string(),
})

export const moduleUpdateResponseSchema = z.object({
  ok: z.boolean(),
  module: z.string(),
  config: z.unknown(),
})

export type DashboardGuild = z.infer<typeof dashboardGuildSchema>
export type DashboardChannel = z.infer<typeof channelSchema>
export type DashboardRole = z.infer<typeof roleSchema>
export type MessageEntry = z.infer<typeof messageEntrySchema>
export type AntiNukeConfig = z.infer<typeof antinukeSchema>
export type AntiNukeModule = z.infer<typeof antinukeModuleSchema>
export type HoneypotConfig = z.infer<typeof honeypotSchema>
export type GuildConfig = z.infer<typeof guildConfigSchema>
