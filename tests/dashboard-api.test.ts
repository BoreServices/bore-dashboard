import { describe, expect, it } from 'vitest'
import {
  antinukeBodySchema,
  antinukeThreshold,
  aliasBodySchema,
  authorizeGuild,
  guildIdFromPath,
  honeypotBodySchema,
  isConfigModule,
  messageBodySchema,
  moduleFromPath,
  normalizeAlias,
  prefixBodySchema,
} from '../api/_lib/dashboard.js'
import { hasPermission } from '../api/_lib/permissions.js'

describe('permission checks', () => {
  it('lets an administrator do anything', () => {
    expect(hasPermission('8', 'manage_messages')).toBe(true)
    expect(hasPermission('8', 'administrator')).toBe(true)
    expect(hasPermission('8', 'manage_roles')).toBe(true)
  })

  it('checks the exact bit', () => {
    expect(hasPermission('8192', 'manage_messages')).toBe(true)
    expect(hasPermission('8192', 'manage_guild')).toBe(false)
    expect(hasPermission('32', 'manage_guild')).toBe(true)
    expect(hasPermission('268435456', 'manage_roles')).toBe(true)
  })

  it('denies everything without a bitfield', () => {
    expect(hasPermission('0', 'manage_messages')).toBe(false)
    expect(hasPermission(null, 'manage_messages')).toBe(false)
    expect(hasPermission('not-a-number', 'manage_messages')).toBe(false)
  })
})

describe('dashboard paths', () => {
  it('reads the guild id out of a dashboard path', () => {
    expect(guildIdFromPath('/api/dashboard/guilds/123/config')).toBe('123')
    expect(guildIdFromPath('/api/dashboard/guilds/123/channels')).toBe('123')
    expect(guildIdFromPath('/api/dashboard/guilds/not-a-number/config')).toBeNull()
    expect(guildIdFromPath('/api/dashboard/guilds')).toBeNull()
  })

  it('reads the module out of a dashboard path', () => {
    expect(moduleFromPath('/api/dashboard/guilds/123/config/welcome')).toBe('welcome')
    expect(moduleFromPath('/api/dashboard/guilds/123/config/nope')).toBe('nope')
    expect(moduleFromPath('/api/dashboard/guilds/123/config')).toBeNull()
  })

  it('knows the configuration modules', () => {
    expect(isConfigModule('honeypot')).toBe(true)
    expect(isConfigModule('antiraid')).toBe(false)
  })
})

describe('request bodies', () => {
  it('validates the prefix', () => {
    expect(prefixBodySchema.safeParse({ prefix: '!' }).success).toBe(true)
    expect(prefixBodySchema.safeParse({ prefix: null }).success).toBe(true)
    expect(prefixBodySchema.safeParse({ prefix: '' }).success).toBe(false)
    expect(prefixBodySchema.safeParse({ prefix: 'toolongprefix' }).success).toBe(false)
    expect(prefixBodySchema.safeParse({ prefix: 'two words' }).success).toBe(false)
  })

  it('validates a channel message', () => {
    expect(
      messageBodySchema.safeParse({ action: 'upsert', channelId: '1', message: 'hi' })
        .success,
    ).toBe(true)
    expect(
      messageBodySchema.safeParse({ action: 'delete', channelId: '1' }).success,
    ).toBe(true)
    expect(
      messageBodySchema.safeParse({ action: 'upsert', channelId: '1', message: '' })
        .success,
    ).toBe(false)
    expect(
      messageBodySchema.safeParse({
        action: 'upsert',
        channelId: '1',
        message: 'x'.repeat(4001),
      }).success,
    ).toBe(false)
    expect(
      messageBodySchema.safeParse({ action: 'upsert', channelId: 'abc', message: 'hi' })
        .success,
    ).toBe(false)
  })

  it('validates an alias', () => {
    expect(
      aliasBodySchema.safeParse({ action: 'add', alias: 'mod', command: 'purge' }).success,
    ).toBe(true)
    expect(
      aliasBodySchema.safeParse({ action: 'delete', alias: 'mod' }).success,
    ).toBe(true)
    expect(
      aliasBodySchema.safeParse({ action: 'add', alias: '', command: 'purge' }).success,
    ).toBe(false)
  })

  it('validates the anti-nuke body', () => {
    expect(antinukeBodySchema.safeParse({ enabled: false }).success).toBe(true)
    expect(antinukeBodySchema.safeParse({ windowSeconds: 60 }).success).toBe(true)
    expect(antinukeBodySchema.safeParse({ windowSeconds: 61 }).success).toBe(false)
    expect(
      antinukeBodySchema.safeParse({
        modules: [{ module: 'ban', punishment: 'ban', threshold: 3 }],
      }).success,
    ).toBe(true)
    expect(
      antinukeBodySchema.safeParse({
        modules: [{ module: 'ban', punishment: 'nuke', threshold: 3 }],
      }).success,
    ).toBe(false)
    expect(
      antinukeBodySchema.safeParse({
        modules: [{ module: 'ban', punishment: 'ban', threshold: 26 }],
      }).success,
    ).toBe(false)
    expect(
      antinukeBodySchema.safeParse({ modules: [{ module: 'ban', enabled: false }] })
        .success,
    ).toBe(true)
  })

  it('validates the honeypot body', () => {
    expect(
      honeypotBodySchema.safeParse({ staffRoleId: null, logChannelId: null }).success,
    ).toBe(true)
    expect(
      honeypotBodySchema.safeParse({
        action: 'add',
        channelId: '1',
        punishment: 'jail',
      }).success,
    ).toBe(true)
    expect(
      honeypotBodySchema.safeParse({ action: 'add', channelId: '1' }).success,
    ).toBe(false)
    expect(honeypotBodySchema.safeParse({}).success).toBe(false)
  })
})

describe('alias normalisation', () => {
  it('lowercases and strips spaces, like the bot does', () => {
    expect(normalizeAlias('My Alias')).toBe('myalias')
    expect(normalizeAlias('PURGE')).toBe('purge')
  })
})

describe('anti-nuke thresholds', () => {
  it('keeps the threshold of a counted module', () => {
    expect(antinukeThreshold('ban', 4)).toBe(4)
  })

  it('forces the instant modules to 1', () => {
    for (const module of ['botadd', 'prune', 'vanity', 'guild']) {
      expect(antinukeThreshold(module, 7)).toBe(1)
    }
  })
})

describe('authorisation', () => {
  it('never authorises a guild the user is not in', async () => {
    const res = { writeHead: () => undefined, end: () => undefined } as never
    const session = {
      user: { id: '1', username: 'bore', globalName: null, avatar: null },
      accessToken: 'token',
      exp: Math.floor(Date.now() / 1000) + 60,
    }

    const access = await authorizeGuild(session, res, '999')
    expect(access).toBeNull()
  })
})
