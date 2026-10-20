import { beforeEach, describe, expect, it } from 'vitest'
import type { IncomingMessage } from 'node:http'
import {
  consumeOAuthState,
  decryptSession,
  encryptSession,
  readSession,
  SESSION_COOKIE,
  OAUTH_STATE_COOKIE,
  type SessionPayload,
} from '../api/_lib/session.js'

const SECRET = 'test-secret-value-for-encryption-checks'

function request(cookie?: string): IncomingMessage {
  return { headers: cookie ? { cookie } : {} } as unknown as IncomingMessage
}

const payload: SessionPayload = {
  user: { id: '1', username: 'bore', globalName: 'Bore', avatar: null },
  accessToken: 'token',
  exp: Math.floor(Date.now() / 1000) + 60,
}

describe('session encryption', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET
  })

  it('round-trips a session payload', () => {
    const token = encryptSession(payload, SECRET)
    expect(token).not.toContain('token')
    expect(decryptSession(token, SECRET)).toEqual(payload)
  })

  it('rejects a token that was tampered with', () => {
    const token = encryptSession(payload, SECRET)
    expect(decryptSession(`${token}x`, SECRET)).toBeNull()
  })

  it('rejects a token encrypted with a different secret', () => {
    const token = encryptSession(payload, SECRET)
    expect(decryptSession(token, 'another-secret')).toBeNull()
  })

  it('rejects an expired session', () => {
    const token = encryptSession({ ...payload, exp: Math.floor(Date.now() / 1000) - 10 }, SECRET)
    expect(decryptSession(token, SECRET)).toBeNull()
  })
})

describe('session protection', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET
  })

  it('returns null without a session cookie', () => {
    expect(readSession(request())).toBeNull()
  })

  it('returns null when no secret is configured', () => {
    delete process.env.SESSION_SECRET
    const token = encryptSession(payload, SECRET)
    expect(readSession(request(`${SESSION_COOKIE}=${token}`))).toBeNull()
  })

  it('reads a valid session cookie', () => {
    const token = encryptSession(payload, SECRET)
    const session = readSession(request(`${SESSION_COOKIE}=${token}`))
    expect(session?.user.username).toBe('bore')
  })
})

describe('oauth state validation', () => {
  it('accepts a matching state', () => {
    expect(consumeOAuthState(request(`${OAUTH_STATE_COOKIE}=abc123`), 'abc123')).toBe(true)
  })

  it('rejects a mismatched state', () => {
    expect(consumeOAuthState(request(`${OAUTH_STATE_COOKIE}=abc123`), 'other')).toBe(false)
  })

  it('rejects a missing state cookie', () => {
    expect(consumeOAuthState(request(), 'abc123')).toBe(false)
  })

  it('rejects a missing state parameter', () => {
    expect(consumeOAuthState(request(`${OAUTH_STATE_COOKIE}=abc123`), null)).toBe(false)
  })
})
