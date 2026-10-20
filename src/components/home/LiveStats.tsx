import { Link } from 'react-router-dom'
import { Activity, Command, Server, Users } from 'lucide-react'
import { useCommandsQuery, useStatsQuery, useStatusQuery } from '../../lib/queries'
import { deriveOverallStatus, STATUS_META } from '../../lib/status'
import { formatNumber } from '../../lib/format'
import { Skeleton } from '../ui/Skeleton'

type Tile = {
  label: string
  value: string | null
  icon: typeof Users
  hint: string
  to: string
}

export function LiveStats() {
  const stats = useStatsQuery()
  const status = useStatusQuery()
  const commands = useCommandsQuery()

  const loading = stats.isPending || status.isPending
  const unavailable = stats.isError || status.isError
  const overall = deriveOverallStatus(status.data?.shards)

  const tiles: Tile[] = [
    {
      label: 'Servers',
      value: stats.data ? formatNumber(stats.data.servers) : null,
      icon: Server,
      hint: stats.isError ? 'Live data unavailable' : 'Servers Bore is connected to',
      to: '/status',
    },
    {
      label: 'Members',
      value: stats.data ? formatNumber(stats.data.members) : null,
      icon: Users,
      hint: stats.isError ? 'Live data unavailable' : 'Members in those servers',
      to: '/status',
    },
    {
      label: 'Commands',
      value: commands.data ? formatNumber(commands.data.commandCount) : null,
      icon: Command,
      hint: commands.isError ? 'Directory unavailable' : 'Published in the directory',
      to: '/commands',
    },
    {
      label: 'Availability',
      value: unavailable ? null : STATUS_META[overall].label,
      icon: Activity,
      hint: unavailable ? 'Live data unavailable' : STATUS_META[overall].description,
      to: '/status',
    },
  ]

  return (
    <section aria-label="Live bot statistics" className="border-y border-line bg-white/70">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className="group flex flex-col gap-1 px-2 py-6 transition-colors hover:bg-brand-50/50 sm:px-4"
          >
            <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
              <tile.icon className="h-3.5 w-3.5 text-brand-500" aria-hidden />
              {tile.label}
            </span>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <span className="text-2xl font-semibold tracking-tight text-ink">
                {tile.value ?? '—'}
              </span>
            )}
            <span className="text-xs text-ink-muted">{tile.hint}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
