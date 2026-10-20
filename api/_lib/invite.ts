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
 * A Discord installation link built from the bot's own application id.
 *
 * `BOT_CLIENT_ID` has to be the application the *bot* was created under — the
 * website's OAuth application id is a different thing and cannot be installed
 * as a bot. Returns null when it is not configured, so the caller falls back to
 * the plain invite link instead of linking to something broken.
 */
export function buildBotInviteUrl(guildId?: string): string | null {
  const clientId = env('BOT_CLIENT_ID')
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
