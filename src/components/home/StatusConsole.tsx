import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useCommandsQuery, useStatsQuery, useStatusQuery } from '../../lib/queries'
import { deriveOverallStatus, resolveUptimeSeconds, summarizeShards } from '../../lib/status'
import { formatNumber, formatRelativeTime, formatUptime } from '../../lib/format'
import { StatusDot } from '../ui/StatusDot'
import { Skeleton } from '../ui/Skeleton'

/**
 * A live read-out of the bot. Everything here comes from the bot API — when
 * the API cannot be reached the panel says so instead of showing numbers.
 */
export function StatusConsole() {
  const status = useStatusQuery()
  const stats = useStatsQuery()
  const commands = useCommandsQuery()

  const shards = status.data?.shards
  const summary = summarizeShards(shards)
  const overall = deriveOverallStatus(shards)
  const uptime = resolveUptimeSeconds(summary.uptime)

  const rows: { label: string; value: string }[] = [
    { label: 'shards', value: summary.shards ? `${summary.ready}/${summary.shards}` : '—' },
    { label: 'servers', value: stats.data ? formatNumber(stats.data.servers) : '—' },
    { label: 'members', value: stats.data ? formatNumber(stats.data.members) : '—' },
    { label: 'commands', value: commands.data ? formatNumber(commands.data.commandCount) : '—' },
    {
      label: 'latency',
      value: summary.shards ? `${Math.round(summary.averageLatency)} ms` : '—',
    },
    { label: 'uptime', value: uptime ? formatUptime(uptime) : '—' },
  ]

  const unavailable = status.isError && stats.isError

  return (
    <div className="rounded border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
          bot status
        </span>
        {unavailable ? (
          <StatusDot tone="neutral" label="unreachable" />
        ) : (
          <StatusDot
            tone={overall === 'operational' ? 'success' : overall === 'degraded' ? 'warning' : 'neutral'}
            label={overall === 'operational' ? 'operational' : overall === 'degraded' ? 'degraded' : 'unknown'}
            pulse={overall === 'operational'}
          />
        )}
      </div>

      <dl className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 px-3.5 py-1.5">
            <dt className="font-mono text-2xs uppercase tracking-[0.08em] text-ink-muted">
              {row.label}
            </dt>
            <dd className="font-mono text-base tabular-nums text-ink">
              {status.isPending && stats.isPending && commands.isPending ? (
                <Skeleton className="h-3 w-12" />
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3.5 py-2">
        <span className="font-mono text-2xs text-ink-muted">
          {status.dataUpdatedAt ? `checked ${formatRelativeTime(status.dataUpdatedAt)}` : 'not checked'}
        </span>
        <Link
          to="/status"
          className="inline-flex items-center gap-1 text-2xs font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          status page
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
