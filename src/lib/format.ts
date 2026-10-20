export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const total = Math.floor(seconds)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes || parts.length === 0) parts.push(`${minutes}m`)
  return parts.join(' ')
}

export function formatRelativeTime(date: Date | number | null | undefined): string {
  if (!date) return 'never'
  const value = typeof date === 'number' ? date : date.getTime()
  if (!Number.isFinite(value)) return 'never'
  const seconds = Math.round((Date.now() - value) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function formatLatency(ms: number): string {
  if (!Number.isFinite(ms)) return '—'
  return `${Math.round(ms)} ms`
}

export function formatTimestamp(date: Date | number): string {
  const value = typeof date === 'number' ? new Date(date) : date
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
