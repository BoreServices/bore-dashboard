import { describe, expect, it } from 'vitest'
import { categoryCounts, filterCategories, matchesSearch } from '../src/lib/commands'
import type { CommandCategory } from '../src/types/api'

const categories: CommandCategory[] = [
  {
    name: 'Moderation',
    commands: [
      {
        name: 'ban',
        description: 'Ban a user from the server',
        category: 'Moderation',
        args: 'user',
        syntax: 'ban (user)',
        permissions: ['ban members'],
        aliases: [],
        cooldown: '2 per 5s (user)',
        example: ',ban @spammer spam',
        flags: [],
      },
      {
        name: 'purge',
        description: 'Bulk delete messages',
        category: 'Moderation',
        args: 'amount',
        syntax: 'purge (amount)',
        permissions: ['manage messages'],
        aliases: ['clear'],
        cooldown: null,
        example: null,
        flags: [],
      },
    ],
  },
  {
    name: 'Fun',
    commands: [
      {
        name: '8ball',
        description: 'Ask the magic eight ball',
        category: 'Fun',
        args: 'question',
        syntax: '8ball (question)',
        permissions: [],
        aliases: [],
        cooldown: null,
        example: null,
        flags: [],
      },
    ],
  },
]

describe('command filtering', () => {
  it('matches on name, description, aliases and permissions', () => {
    const [ban] = categories[0].commands
    expect(matchesSearch(ban, 'ban')).toBe(true)
    expect(matchesSearch(ban, 'server')).toBe(true)
    expect(matchesSearch(ban, 'ban members')).toBe(true)
    expect(matchesSearch(ban, 'nothinghere')).toBe(false)
  })

  it('filters by category while keeping the grouping', () => {
    const result = filterCategories(categories, { query: '', category: 'Fun' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Fun')
    expect(result[0].commands).toHaveLength(1)
  })

  it('searches across every category and drops empty ones', () => {
    const result = filterCategories(categories, { query: '8ball', category: null })
    expect(result).toHaveLength(1)
    expect(result[0].commands[0].name).toBe('8ball')
  })

  it('returns nothing when the search matches no command', () => {
    expect(filterCategories(categories, { query: 'zzzz', category: null })).toHaveLength(0)
  })

  it('counts commands per category', () => {
    expect(categoryCounts(categories)).toEqual([
      { name: 'Moderation', count: 2 },
      { name: 'Fun', count: 1 },
    ])
  })
})
