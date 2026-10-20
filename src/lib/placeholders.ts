export type Placeholder = {
  token: string
  description: string
}

/** Placeholders understood by `EmbedBuilder.embed_replacement` in the bot. */
export const PLACEHOLDERS: Placeholder[] = [
  { token: '{user}', description: 'Username with discriminator, e.g. bore#0001' },
  { token: '{user.name}', description: 'Username without discriminator' },
  { token: '{user.mention}', description: 'Mention of the author' },
  { token: '{user.avatar}', description: 'Direct link to the author avatar' },
  { token: '{user.discriminator}', description: 'Four digit discriminator' },
  { token: '{user.created_at}', description: 'Account creation date (relative time)' },
  { token: '{user.joined_at}', description: 'Server join date (relative time)' },
  { token: '{guild.name}', description: 'Server name' },
  { token: '{guild.id}', description: 'Server ID' },
  { token: '{guild.count}', description: 'Member count' },
  { token: '{guild.count.format}', description: 'Member count as an ordinal, e.g. 12th' },
  { token: '{guild.created_at}', description: 'Server creation date (relative time)' },
  { token: '{guild.boost_count}', description: 'Number of boosts' },
  { token: '{guild.boost_count.format}', description: 'Boost count as an ordinal' },
  { token: '{guild.booster_count}', description: 'Number of boosters' },
  { token: '{guild.booster_count.format}', description: 'Booster count as an ordinal' },
  { token: '{guild.boost_tier}', description: 'Server boost tier' },
  { token: '{guild.vanity}', description: 'Vanity invite code of the server' },
  { token: '{guild.icon}', description: 'Direct link to the server icon' },
  { token: '{invisible}', description: 'Invisible embed colour (#2B2D31)' },
  { token: '{botcolor}', description: 'Bore embed colour (#7D7EAD)' },
]

const PLACEHOLDER_PATTERN = /\{[a-z_.]+\}/gi

export function findPlaceholders(text: string): string[] {
  const matches = text.match(PLACEHOLDER_PATTERN)
  return matches ? Array.from(new Set(matches)) : []
}

export function isKnownPlaceholder(token: string): boolean {
  return PLACEHOLDERS.some((placeholder) => placeholder.token.toLowerCase() === token.toLowerCase())
}
