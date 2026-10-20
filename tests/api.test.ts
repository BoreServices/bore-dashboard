import { describe, expect, it } from 'vitest'
import { noneToNull, normalizePermissions } from '../api/_lib/proxy.js'
import { safeNextPath } from '../api/_lib/redirect.js'

describe('bot api normalisation', () => {
  it('treats the literal string None as missing', () => {
    expect(noneToNull('None')).toBeNull()
    expect(noneToNull('none')).toBeNull()
    expect(noneToNull('')).toBeNull()
    expect(noneToNull(undefined)).toBeNull()
    expect(noneToNull('Ban a user')).toBe('Ban a user')
  })

  it('normalises permission payloads', () => {
    expect(normalizePermissions('None')).toEqual([])
    expect(normalizePermissions([''])).toEqual([])
    expect(normalizePermissions(['ban members', 'manage messages'])).toEqual([
      'ban members',
      'manage messages',
    ])
    expect(normalizePermissions(['manage messages', ''])).toEqual(['manage messages'])
  })
})

describe('redirect validation', () => {
  it('allows known internal paths', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard')
    expect(safeNextPath('/commands')).toBe('/commands')
  })

  it('rejects external or protocol relative redirects', () => {
    expect(safeNextPath('https://evil.example')).toBeNull()
    expect(safeNextPath('//evil.example')).toBeNull()
    expect(safeNextPath('/unknown')).toBeNull()
    expect(safeNextPath(null)).toBeNull()
  })
})
