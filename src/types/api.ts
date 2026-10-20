import { z } from 'zod'

export const commandSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  args: z.string().nullable(),
  syntax: z.string().nullable(),
  permissions: z.array(z.string()),
  aliases: z.array(z.string()),
  cooldown: z.string().nullable(),
  example: z.string().nullable(),
  flags: z.array(z.string()),
})

export const commandCategorySchema = z.object({
  name: z.string(),
  commands: z.array(commandSchema),
})

export const commandsResponseSchema = z.object({
  categories: z.array(commandCategorySchema),
  commandCount: z.number(),
  fetchedAt: z.string(),
})

export const shardSchema = z.object({
  shardId: z.number(),
  isReady: z.boolean(),
  serverCount: z.number(),
  cachedUserCount: z.number(),
  uptime: z.number(),
  latency: z.number(),
})

export const statusResponseSchema = z.object({
  shards: z.array(shardSchema),
  fetchedAt: z.string(),
})

export const shardsResponseSchema = z.object({
  shards: z.array(
    z.object({
      shardId: z.number(),
      guildIds: z.array(z.string()),
    }),
  ),
  fetchedAt: z.string(),
})

export const statsResponseSchema = z.object({
  members: z.number(),
  servers: z.number(),
  fetchedAt: z.string(),
})

export const sessionUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  globalName: z.string().nullable(),
  avatar: z.string().nullable(),
})

export const sessionGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  owner: z.boolean(),
  memberCount: z.number().nullable(),
})

export const sessionResponseSchema = z.object({
  user: sessionUserSchema,
  guilds: z.array(sessionGuildSchema).optional(),
  guildsAvailable: z.boolean().optional(),
  expiresAt: z.string(),
})

export const guildConfigSchema = z.object({
  guild: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().nullable(),
    owner: z.boolean(),
    memberCount: z.number().nullable(),
  }),
  prefix: z.string().nullable(),
  prefixSource: z.enum(['database', 'default', 'unavailable']),
  databaseConfigured: z.boolean(),
})

export type Command = z.infer<typeof commandSchema>
export type CommandCategory = z.infer<typeof commandCategorySchema>
export type CommandsResponse = z.infer<typeof commandsResponseSchema>
export type Shard = z.infer<typeof shardSchema>
export type StatusResponse = z.infer<typeof statusResponseSchema>
export type StatsResponse = z.infer<typeof statsResponseSchema>
export type ShardsResponse = z.infer<typeof shardsResponseSchema>
export type SessionUser = z.infer<typeof sessionUserSchema>
export type SessionGuild = z.infer<typeof sessionGuildSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
export type GuildConfig = z.infer<typeof guildConfigSchema>
