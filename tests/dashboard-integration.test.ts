import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import guildsHandler from '../api/dashboard/guilds.js'
import guildConfigHandler from '../api/dashboard/guilds/[guildId]/config.js'
import guildChannelsHandler from '../api/dashboard/guilds/[guildId]/channels.js'
import guildRolesHandler from '../api/dashboard/guilds/[guildId]/roles.js'
import guildConfigModuleHandler from '../api/dashboard/guilds/[guildId]/config/[module].js'
import { encryptSession, SESSION_COOKIE } from '../api/_lib/session.js'

/**
 * Live integration test.
 *
 * Discord itself is mocked — the site never talks to Discord from a test —
 * but the database and the bot API are the real ones, so this proves the
 * dashboard reads and writes the tables the bot actually uses, and that
 * channels and roles really come from the bot.
 *
 * It is skipped unless the environment can reach both:
 *
 *   BORE_INTEGRATION=1 npm run test
 */

const INTEGRATION = process.env.BORE_INTEGRATION === '1'
const GUILD_ID = '1462713636878553201'
const FOREIGN_GUILD_ID = '999999999999999999'
/** A guild that exists in Discord but not in the bot's database. */
const SCRATCH_GUILD_ID = '1462713636878553202'
/** The same, but without any permission the bot checks for. */
const NO_PERMS_GUILD_ID = '1462713636878553203'
const SESSION_SECRET = 'integration-secret-value-for-the-session-cookie'

type MockResponse = ServerResponse & {
  statusCode: number
  headers: Record<string, string | string[]>
  body: string
}

function mockRequest(
  url: string,
  cookie?: string,
  method = 'GET',
  body?: string,
): IncomingMessage {
  return {
    url,
    method,
    headers: {
      host: 'bore.example',
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    socket: { remoteAddress: '127.0.0.1' },
    async *[Symbol.asyncIterator]() {
      if (body) yield Buffer.from(body, 'utf8')
    },
  } as unknown as IncomingMessage
}

function mockResponse(): MockResponse {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string | string[]>,
    body: '',
    writeHead(status: number, headers?: Record<string, string>) {
      response.statusCode = status
      Object.assign(response.headers, headers ?? {})
      return response
    },
    setHeader(name: string, value: string | string[]) {
      response.headers[name] = value
      return response
    },
    getHeader(name: string) {
      return response.headers[name]
    },
    end(body?: string) {
      response.body = body ?? ''
      return response
    },
  }
  return response as unknown as MockResponse
}

function sessionCookie(): string {
  const token = encryptSession(
    {
      user: {
        id: '1000000000000000001',
        username: 'bore',
        globalName: 'Bore',
        avatar: null,
      },
      accessToken: 'integration-access-token',
      exp: Math.floor(Date.now() / 1000) + 600,
    },
    SESSION_SECRET,
  )
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}`
}

/** The guild list Discord would return for the signed-in user. */
const discordGuilds = [
  {
    id: GUILD_ID,
    name: 'bore testing',
    icon: null,
    owner: true,
    permissions: '8',
    approximate_member_count: 12,
  },
  {
    id: SCRATCH_GUILD_ID,
    name: 'scratch guild',
    icon: null,
    owner: false,
    permissions: '8224',
    approximate_member_count: 1,
  },
  {
    id: NO_PERMS_GUILD_ID,
    name: 'read only guild',
    icon: null,
    owner: false,
    permissions: '0',
    approximate_member_count: 1,
  },
]

describe.skipIf(!INTEGRATION)('dashboard against the live bot database', () => {
  const realFetch = globalThis.fetch

  beforeAll(() => {
    process.env.SESSION_SECRET = SESSION_SECRET

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.startsWith('https://discord.com/api/v10/users/@me/guilds')) {
        return new Response(JSON.stringify(discordGuilds), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      // jsdom's AbortSignal is not the one Node's fetch accepts, so the
      // timeout signal is dropped for the real request.
      const { signal: _signal, ...rest } = init ?? {}
      return realFetch(input as RequestInfo, rest)
    }) as typeof fetch
  })

  afterAll(() => {
    globalThis.fetch = realFetch
  })

  it('lists only the servers the signed-in user is in', async () => {
    const res = mockResponse()
    await guildsHandler(mockRequest('/api/dashboard/guilds', sessionCookie()), res)

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.guilds).toHaveLength(3)
    expect(body.guilds.map((guild: { id: string }) => guild.id)).toContain(GUILD_ID)
    expect(body.guilds.find((guild: { id: string }) => guild.id === GUILD_ID).permissions).toBe('8')
  })

  it('reports whether the bot is installed in the server', async () => {
    const res = mockResponse()
    await guildsHandler(mockRequest('/api/dashboard/guilds', sessionCookie()), res)

    const body = JSON.parse(res.body)
    expect(body.guilds[0].botInstalled).toBe(true)
  })

  it('refuses a server the user is not in', async () => {
    const res = mockResponse()
    await guildConfigHandler(
      mockRequest(`/api/dashboard/guilds/${FOREIGN_GUILD_ID}/config`, sessionCookie()),
      res,
    )

    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error).toBe('forbidden')
  })

  it('requires a session', async () => {
    const res = mockResponse()
    await guildConfigHandler(
      mockRequest(`/api/dashboard/guilds/${GUILD_ID}/config`),
      res,
    )

    expect(res.statusCode).toBe(401)
  })

  it('reads the stored configuration from the bot tables', async () => {
    const res = mockResponse()
    await guildConfigHandler(
      mockRequest(`/api/dashboard/guilds/${GUILD_ID}/config`, sessionCookie()),
      res,
    )

    expect(res.statusCode, res.body).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.guild.id).toBe(GUILD_ID)
    expect(Array.isArray(body.welcome)).toBe(true)
    expect(Array.isArray(body.leave)).toBe(true)
    expect(Array.isArray(body.boost)).toBe(true)
    expect(Array.isArray(body.autoroles)).toBe(true)
    expect(body.antinuke).toHaveProperty('enabled')
    expect(body.honeypot).toHaveProperty('jailRoleId')
  })

  it('lists the channels of the server through the bot', async () => {
    const res = mockResponse()
    await guildChannelsHandler(
      mockRequest(`/api/dashboard/guilds/${GUILD_ID}/channels`, sessionCookie()),
      res,
    )

    expect(res.statusCode, res.body).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.channels.length).toBeGreaterThan(0)
    for (const channel of body.channels) {
      expect([0, 5]).toContain(channel.type)
    }
  })

  it('lists the roles of the server through the bot', async () => {
    const res = mockResponse()
    await guildRolesHandler(
      mockRequest(`/api/dashboard/guilds/${GUILD_ID}/roles`, sessionCookie()),
      res,
    )

    expect(res.statusCode, res.body).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.roles.length).toBeGreaterThan(0)
  })

  it('refuses a write without the required permission', async () => {
    const res = mockResponse()
    await guildConfigModuleHandler(
      mockRequest(
        `/api/dashboard/guilds/${NO_PERMS_GUILD_ID}/config/prefix`,
        sessionCookie(),
        'PATCH',
        JSON.stringify({ prefix: '!' }),
      ),
      res,
    )

    expect(res.statusCode, res.body).toBe(403)
    expect(JSON.parse(res.body).error).toBe('missing_permission')
  })

  it('rejects an invalid value', async () => {
    const res = mockResponse()
    await guildConfigModuleHandler(
      mockRequest(
        `/api/dashboard/guilds/${GUILD_ID}/config/prefix`,
        sessionCookie(),
        'PATCH',
        JSON.stringify({ prefix: '' }),
      ),
      res,
    )

    expect(res.statusCode, res.body).toBe(400)
    expect(JSON.parse(res.body).error).toBe('invalid_request')
  })

  it('writes a value and reads it back', async () => {
    const request = (prefix: string | null) =>
      mockRequest(
        `/api/dashboard/guilds/${SCRATCH_GUILD_ID}/config/prefix`,
        sessionCookie(),
        'PATCH',
        JSON.stringify({ prefix }),
      )

    const write = mockResponse()
    await guildConfigModuleHandler(request('!'), write)
    expect(write.statusCode, write.body).toBe(200)
    expect(JSON.parse(write.body).config).toBe('!')

    const read = mockResponse()
    await guildConfigHandler(
      mockRequest(`/api/dashboard/guilds/${SCRATCH_GUILD_ID}/config`, sessionCookie()),
      read,
    )
    expect(read.statusCode, read.body).toBe(200)
    expect(JSON.parse(read.body).prefix).toBe('!')

    // Put the scratch guild back the way it was.
    const cleanup = mockResponse()
    await guildConfigModuleHandler(request(null), cleanup)
    expect(cleanup.statusCode, cleanup.body).toBe(200)
    expect(JSON.parse(cleanup.body).config).toBeNull()
  })
  it('arms and disarms an anti-nuke module', async () => {
    const request = (body: unknown) =>
      mockRequest(
        `/api/dashboard/guilds/${SCRATCH_GUILD_ID}/config/antinuke`,
        sessionCookie(),
        'PATCH',
        JSON.stringify(body),
      )

    const arm = mockResponse()
    await guildConfigModuleHandler(
      request({ modules: [{ module: 'ban', punishment: 'ban', threshold: 4 }] }),
      arm,
    )
    expect(arm.statusCode, arm.body).toBe(200)

    const read = mockResponse()
    await guildConfigHandler(
      mockRequest(`/api/dashboard/guilds/${SCRATCH_GUILD_ID}/config`, sessionCookie()),
      read,
    )
    expect(read.statusCode, read.body).toBe(200)
    const armed = JSON.parse(read.body).antinuke.modules
    expect(armed).toEqual([{ module: 'ban', punishment: 'ban', threshold: 4 }])

    const disarm = mockResponse()
    await guildConfigModuleHandler(
      request({ modules: [{ module: 'ban', enabled: false }] }),
      disarm,
    )
    expect(disarm.statusCode, disarm.body).toBe(200)

    const readBack = mockResponse()
    await guildConfigHandler(
      mockRequest(`/api/dashboard/guilds/${SCRATCH_GUILD_ID}/config`, sessionCookie()),
      readBack,
    )
    expect(JSON.parse(readBack.body).antinuke.modules).toEqual([])
  })
})
