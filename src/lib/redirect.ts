/**
 * Only same-site paths we own may be used as a post-login redirect. Shared by
 * the browser and the serverless functions so both enforce the same rule.
 */
const ALLOWED_PATHS = ['/', '/dashboard', '/commands', '/status', '/embed']

export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  const path = value.split('?')[0] ?? ''
  if (!ALLOWED_PATHS.includes(path)) return null
  return value
}
