import { env } from './env.js'

/**
 * The permissions Bore needs for the features the dashboard manages:
 *
 * - view channels, send messages, embed links and read message history, for
 *   the welcome, leave, boost and honeypot messages,
 * - manage messages, for the purge command,
 * - manage roles, for auto roles, the honeypot jail role and anti-nuke,
 * - ban and kick members, for the anti-nuke and honeypot punishments.
 *
 * Nothing beyond that is requested: the bot is not granted administrator.
 */
export const BOT_PERMISSIONS = 268528646

/**
 * A Discord installation link built from the configured application id.
 * Returns null when the OAuth application is not configured, so the caller
 * can fall back to a generic invite instead of linking to a broken url.
 */
export function buildBotInviteUrl(guildId?: string): string | null {
  const clientId = env('DISCORD_CLIENT_ID')
  if (!clientId) return null

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'bot',
    permissions: String(BOT_PERMISSIONS),
  })
  if (guildId) {
    params.set('guild_id', guildId)
    params.set('disable_guild_select', 'true')
  }
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}
