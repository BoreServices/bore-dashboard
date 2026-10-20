/**
 * Public site configuration. Only values that are safe to ship to the browser
 * live here — anything secret belongs in a server-side environment variable.
 */
export const SITE = {
  name: 'Bore',
  company: 'BoreBot LLC',
  tagline: 'Moderation, utility and automation for Discord.',
  description:
    'Bore is a Discord bot for moderation, anti-raid protection, server automation, music and community utilities — with a live command directory and an embed builder.',
  inviteUrl: import.meta.env.VITE_DISCORD_INVITE_URL || 'https://bore.best/discord',
  supportUrl: import.meta.env.VITE_SUPPORT_URL || 'https://bore.best/discord',
  dashboardUrl: import.meta.env.VITE_DASHBOARD_URL || '',
} as const

export const NAV_LINKS = [
  { to: '/commands', label: 'Commands' },
  { to: '/status', label: 'Status' },
  { to: '/embed', label: 'Embed Builder' },
  { to: '/dashboard', label: 'Dashboard' },
] as const
