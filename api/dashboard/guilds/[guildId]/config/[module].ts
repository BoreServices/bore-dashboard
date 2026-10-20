import { z } from 'zod'
import type { ServerResponse } from 'node:http'
import {
  InvalidRequestError,
  MODULE_PERMISSIONS,
  aliasBodySchema,
  authorizeGuild,
  autoroleBodySchema,
  antinukeBodySchema,
  guildIdFromPath,
  honeypotBodySchema,
  isConfigModule,
  loadGuildChannels,
  loadGuildRoles,
  messageBodySchema,
  moduleFromPath,
  normalizeAlias,
  prefixBodySchema,
  readAliasConfig,
  readAntinukeConfig,
  readAutoroleConfig,
  readHoneypotConfig,
  readMessageConfig,
  readPrefixConfig,
  resolveCommandName,
  sendUpstreamError,
  writeAliasConfig,
  writeAntinukeConfig,
  writeAutoroleConfig,
  writeHoneypotConfig,
  writeMessageConfig,
  writePrefixConfig,
} from '../../../../_lib/dashboard.js'
import {
  getRequestUrl,
  methodNotAllowed,
  readJsonBody,
  sendError,
  sendJson,
} from '../../../../_lib/http.js'
import { withRateLimit } from '../../../../_lib/rateLimit.js'
import { readSession } from '../../../../_lib/session.js'

const MESSAGE_MODULES = {
  welcome: 'welcome',
  leave: 'leave',
  boost: 'boost',
} as const

function parseOrFail<T extends z.ZodTypeAny>(
  res: ServerResponse,
  schema: T,
  body: unknown,
): z.infer<T> | null {
  const parsed = schema.safeParse(body)
  if (parsed.success) return parsed.data
  sendError(res, 400, 'invalid_request', 'The request body is invalid.', {
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  })
  return null
}

export default withRateLimit('dashboard_config_write', 60, 60_000, async (req, res) => {
  if (req.method !== 'PATCH') return methodNotAllowed(res, ['PATCH'])

  const { path } = getRequestUrl(req)
  const guildId = guildIdFromPath(path)
  const moduleName = moduleFromPath(path)
  if (!guildId || !moduleName) return sendError(res, 404, 'not_found', 'Unknown route.')
  if (!isConfigModule(moduleName)) {
    return sendError(res, 404, 'not_found', 'Unknown module.')
  }

  const session = readSession(req)
  if (!session) return sendError(res, 401, 'unauthenticated', 'No active session.')

  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch {
    return sendError(res, 400, 'invalid_request', 'The request body is not valid JSON.')
  }

  const access = await authorizeGuild(
    session,
    res,
    guildId,
    MODULE_PERMISSIONS[moduleName],
  )
  if (!access) return

  try {
    switch (moduleName) {
      case 'prefix': {
        const parsed = parseOrFail(res, prefixBodySchema, body)
        if (!parsed) return
        await writePrefixConfig(guildId, parsed.prefix)
        const config = await readPrefixConfig(guildId)
        return sendJson(res, 200, { ok: true, module: moduleName, config })
      }

      case 'welcome':
      case 'leave':
      case 'boost': {
        const parsed = parseOrFail(res, messageBodySchema, body)
        if (!parsed) return
        const channels = await loadGuildChannels(guildId)
        if (!channels.some((channel) => channel.id === parsed.channelId)) {
          throw new InvalidRequestError('That channel is not in this server.')
        }
        const table = MESSAGE_MODULES[moduleName]
        await writeMessageConfig(
          guildId,
          table,
          parsed.channelId,
          parsed.action === 'upsert' ? parsed.message : null,
        )
        const names = new Map(channels.map((channel) => [channel.id, channel.name]))
        const config = await readMessageConfig(guildId, table, names)
        return sendJson(res, 200, { ok: true, module: moduleName, config })
      }

      case 'autoroles': {
        const parsed = parseOrFail(res, autoroleBodySchema, body)
        if (!parsed) return
        const roles = await loadGuildRoles(guildId)
        const role = roles.find((entry) => entry.id === parsed.roleId)
        if (!role) throw new InvalidRequestError('That role is not in this server.')
        if (parsed.action === 'add' && role.managed) {
          throw new InvalidRequestError(
            'Roles managed by an integration cannot be used as autoroles.',
          )
        }
        await writeAutoroleConfig(guildId, parsed.roleId, parsed.action === 'add')
        const names = new Map(roles.map((entry) => [entry.id, entry.name]))
        const config = await readAutoroleConfig(guildId, names)
        return sendJson(res, 200, { ok: true, module: moduleName, config })
      }

      case 'aliases': {
        const parsed = parseOrFail(res, aliasBodySchema, body)
        if (!parsed) return
        const alias = normalizeAlias(parsed.alias)
        if (alias.length < 1 || alias.length > 32) {
          throw new InvalidRequestError('The alias must be 1 to 32 characters long.')
        }
        if (parsed.action === 'add') {
          const command = await resolveCommandName(parsed.command)
          if (!command) {
            throw new InvalidRequestError('That command does not exist.')
          }
          await writeAliasConfig(guildId, alias, command)
        } else {
          await writeAliasConfig(guildId, alias, null)
        }
        const config = await readAliasConfig(guildId)
        return sendJson(res, 200, { ok: true, module: moduleName, config })
      }

      case 'antinuke': {
        const parsed = parseOrFail(res, antinukeBodySchema, body)
        if (!parsed) return
        if (parsed.logChannelId) {
          const channels = await loadGuildChannels(guildId)
          if (!channels.some((channel) => channel.id === parsed.logChannelId)) {
            throw new InvalidRequestError('That channel is not in this server.')
          }
        }
        await writeAntinukeConfig(guildId, parsed)
        const config = await readAntinukeConfig(guildId)
        return sendJson(res, 200, { ok: true, module: moduleName, config })
      }

      case 'honeypot': {
        const parsed = parseOrFail(res, honeypotBodySchema, body)
        if (!parsed) return
        const [roles, channels] = await Promise.all([
          loadGuildRoles(guildId),
          loadGuildChannels(guildId),
        ])
        for (const roleId of [parsed.staffRoleId, parsed.jailRoleId]) {
          if (roleId && !roles.some((role) => role.id === roleId)) {
            throw new InvalidRequestError('That role is not in this server.')
          }
        }
        if (parsed.jailRoleId === guildId) {
          throw new InvalidRequestError(
            'The @everyone role cannot be used as the jail role.',
          )
        }
        if (
          parsed.logChannelId &&
          !channels.some((channel) => channel.id === parsed.logChannelId)
        ) {
          throw new InvalidRequestError('That channel is not in this server.')
        }
        if (
          parsed.channelId &&
          !channels.some((channel) => channel.id === parsed.channelId)
        ) {
          throw new InvalidRequestError('That channel is not in this server.')
        }
        await writeHoneypotConfig(guildId, parsed)
        const names = new Map(channels.map((channel) => [channel.id, channel.name]))
        const config = await readHoneypotConfig(guildId, names)
        return sendJson(res, 200, { ok: true, module: moduleName, config })
      }
    }
  } catch (error) {
    sendUpstreamError(res, error)
  }
})
