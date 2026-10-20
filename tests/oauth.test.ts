import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import login from '../api/auth/login.js'
import callback from '../api/auth/callback.js'
import { readSession, SESSION_COOKIE } from '../api/_lib/session.js'

type MockResponse = ServerResponse & {
  statusCode: number
  headers: Record<string, string | string[]>
  body: string
}

function mockRequest(url: string, headers: Record<string, string> = {}): IncomingMessage {
  return {
    url,
    method: 'GET',
    headers: { host: 'bore.example', ...headers },
    socket: { remoteAddress: '127.0.0.1' },
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

function cookieHeader(response: MockResponse, name: string): string {
  const raw = response.headers['set-cookie']
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const match = list.find((entry) => entry.startsWith(`${name}=`))
  return match ? match.split(';')[0].split('=').slice(1).join('=') : ''
}

describe('discord oauth flow', () => {
  beforeEach(() => {
    process.env.DISCORD_CLIENT_ID = 'client-id'
    process.env.DISCORD_CLIENT_SECRET = 'client-secret'
    process.env.DISCORD_REDIRECT_URI = 'https://bore.example/api/auth/callback'
    process.env.SESSION_SECRET = 'test-secret-value-for-encryption-checks'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.DISCORD_CLIENT_ID
    delete process.env.DISCORD_CLIENT_SECRET
    delete process.env.DISCORD_REDIRECT_URI
    delete process.env.SESSION_SECRET
  })

  it('redirects to Discord with a state parameter and the minimal scopes', async () => {
    const response = mockResponse()
    await login(mockRequest('/api/auth/login'), response)

    expect(response.statusCode).toBe(302)
    const location = String(response.headers.location)
    expect(location.startsWith('https://discord.com/oauth2/authorize')).toBe(true)
    expect(location).toContain('client_id=client-id')
    expect(new URL(location).searchParams.get('scope')).toBe('identify guilds')
    expect(location).toContain(`redirect_uri=${encodeURIComponent('https://bore.example/api/auth/callback')}`)
    expect(location).toContain('state=')
    expect(cookieHeader(response, 'bore_oauth_state')).not.toBe('')
  })

  it('reports missing configuration instead of pretending to sign in', async () => {
    delete process.env.DISCORD_CLIENT_ID
    const response = mockResponse()
    await login(mockRequest('/api/auth/login'), response)

    expect(response.statusCode).toBe(503)
    expect(JSON.parse(response.body).error).toBe('oauth_not_configured')
  })

  it('rejects a callback with a mismatched state', async () => {
    const response = mockResponse()
    await callback(
      mockRequest('/api/auth/callback?code=abc&state=forged', { cookie: 'bore_oauth_state=real' }),
      response,
    )

    expect(response.statusCode).toBe(302)
    expect(String(response.headers.location)).toContain('error=invalid_state')
    expect(cookieHeader(response, SESSION_COOKIE)).toBe('')
  })

  it('exchanges the code server side and sets an encrypted session cookie', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'access-token', token_type: 'Bearer' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (url.includes('/users/@me')) {
        return new Response(
          JSON.stringify({ id: '1', username: 'bore', global_name: 'Bore', avatar: 'abc' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = mockResponse()
    await callback(
      mockRequest('/api/auth/callback?code=abc&state=real', { cookie: 'bore_oauth_state=real' }),
      response,
    )

    expect(response.statusCode).toBe(302)
    expect(String(response.headers.location)).toBe('/dashboard')

    const sessionCookie = cookieHeader(response, SESSION_COOKIE)
    expect(sessionCookie).not.toBe('')
    expect(sessionCookie).not.toContain('access-token')

    const session = readSession(
      mockRequest('/api/auth/me', { cookie: `${SESSION_COOKIE}=${sessionCookie}` }),
    )
    expect(session?.user.username).toBe('bore')
    expect(session?.user.avatar).toContain('cdn.discordapp.com')
  })

  it('reports a Discord failure without leaking details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error_description: 'invalid code' }), { status: 400 })),
    )

    const response = mockResponse()
    await callback(
      mockRequest('/api/auth/callback?code=abc&state=real', { cookie: 'bore_oauth_state=real' }),
      response,
    )

    expect(response.statusCode).toBe(302)
    expect(String(response.headers.location)).toContain('error=')
    expect(String(response.headers.location)).not.toContain('invalid code')
  })
})
