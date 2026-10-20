import { useEffect, useState } from 'react'
import { Activity, RefreshCw, Server, Timer, Users, Wifi } from 'lucide-react'
import clsx from 'clsx'
import { Container, PageHeader } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { StatusPill, type StatusTone } from '../components/ui/StatusPill'
import { ErrorState, InlineNotice } from '../components/ui/States'
import { useStatsQuery, useStatusQuery, useShardsQuery } from '../lib/queries'
import {
  deriveOverallStatus,
  isStale,
  resolveUptimeSeconds,
  STATUS_META,
  summarizeShards,
} from '../lib/status'
import { formatNumber, formatRelativeTime, formatTimestamp, formatUptime } from '../lib/format'
import { usePageMeta } from '../lib/usePageMeta'

export function StatusPage() {
  usePageMeta(
    'Bot status · Bore',
    'Live shard health, latency and uptime for the Bore Discord bot, polled directly from the bot API.',
    '/status',
  )

  const status = useStatusQuery()
  const stats = useStatsQuery()
  const shardsQuery = useShardsQuery()
  const [, setTick] = useState(0)

  // Keeps the relative "last updated" label honest between polls.
  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 5_000)
    return () => window.clearInterval(timer)
  }, [])

  const shardList = status.data?.shards
  const overall = deriveOverallStatus(shardList)
  const summary = summarizeShards(shardList)
  const meta = STATUS_META[overall]
  const stale = isStale(status.dataUpdatedAt)
  const unreachable = status.isError
  const uptime = resolveUptimeSeconds(summary.uptime)

  const tone: StatusTone =
    unreachable || overall === 'unknown'
      ? 'neutral'
      : meta.tone === 'success'
        ? 'success'
        : meta.tone === 'warning'
          ? 'warning'
          : 'danger'

  const tiles = [
    {
      label: 'Servers',
      value: stats.data ? formatNumber(stats.data.servers) : null,
      icon: Server,
    },
    {
      label: 'Members',
      value: stats.data ? formatNumber(stats.data.members) : null,
      icon: Users,
    },
    {
      label: 'Shards',
      value: summary.shards ? `${summary.ready}/${summary.shards}` : null,
      icon: Activity,
    },
    {
      label: 'Average latency',
      value: summary.shards ? `${Math.round(summary.averageLatency)} ms` : null,
      icon: Wifi,
    },
    {
      label: 'Uptime',
      value: uptime ? formatUptime(uptime) : null,
      icon: Timer,
    },
  ]

  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-brand-50/60 to-canvas">
        <Container className="py-12">
          <PageHeader
            eyebrow="Service status"
            title="Bore bot status"
            description="Shard health, latency and reach, polled from the bot API every twelve seconds."
            actions={
              <Button
                variant="outline"
                onClick={() => {
                  void status.refetch()
                  void stats.refetch()
                }}
                loading={status.isFetching}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Refresh
              </Button>
            }
          />
        </Container>
      </div>

      <Container className="py-10">
        <section
          aria-live="polite"
          className={clsx(
            'surface-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between',
            stale && !unreachable && 'border-amber-200 bg-amber-50/40',
          )}
        >
          <div className="flex items-start gap-4">
            <span
              className={clsx(
                'mt-1 h-3 w-3 shrink-0 rounded-full',
                tone === 'success' && 'bg-emerald-500',
                tone === 'warning' && 'bg-amber-500',
                tone === 'danger' && 'bg-rose-500',
                tone === 'neutral' && 'bg-ink-muted/40',
              )}
              aria-hidden
            />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-ink">
                  {unreachable ? 'Status unavailable' : meta.label}
                </h2>
                <StatusPill
                  tone={tone}
                  label={
                    unreachable
                      ? 'Not verified'
                      : stale
                        ? 'Stale data'
                        : `Verified ${formatRelativeTime(status.dataUpdatedAt)}`
                  }
                  pulse={!unreachable && !stale && overall === 'operational'}
                />
              </div>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                {unreachable
                  ? 'The bot API could not be reached, so the status below could not be verified. No assumption is made about the current state of the bot.'
                  : stale
                    ? 'The data below was fetched more than thirty seconds ago and may no longer reflect the live state of the bot.'
                    : meta.description}
              </p>
            </div>
          </div>

          <dl className="shrink-0 text-sm text-ink-muted sm:text-right">
            <div>
              <dt className="text-xs uppercase tracking-wide">Last successful refresh</dt>
              <dd className="mt-1 font-medium text-ink">
                {status.dataUpdatedAt ? formatTimestamp(status.dataUpdatedAt) : 'never'}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-label="Key metrics" className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {tiles.map((tile) => (
            <div key={tile.label} className="surface-card p-5">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
                <tile.icon className="h-3.5 w-3.5 text-brand-500" aria-hidden />
                {tile.label}
              </span>
              {status.isPending || stats.isPending ? (
                <Skeleton className="mt-3 h-7 w-20" />
              ) : (
                <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{tile.value ?? '—'}</p>
              )}
            </div>
          ))}
        </section>

        {unreachable ? (
          <ErrorState
            className="mt-8"
            title="The status API is not responding"
            description={
              <>
                {status.error instanceof Error ? status.error.message : 'The bot API could not be reached.'}{' '}
                Set <code>BOT_API_BASE_URL</code> to the hosted Flask service and make sure it is
                reachable from this deployment.
              </>
            }
            onRetry={() => status.refetch()}
          />
        ) : null}

        <section aria-labelledby="shards-heading" className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 id="shards-heading" className="text-lg font-semibold text-ink">
              Shards
            </h2>
            <p className="text-sm text-ink-muted">
              {summary.shards ? `${summary.ready} of ${summary.shards} ready` : 'No shard data'}
            </p>
          </div>

          {status.isPending ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="surface-card space-y-3 p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : shardList && shardList.length ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shardList.map((shard) => {
                const mapping = shardsQuery.data?.shards.find((entry) => entry.shardId === shard.shardId)
                return (
                  <article key={shard.shardId} className="surface-card p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-sm font-semibold text-ink">Shard #{shard.shardId}</h3>
                      <StatusPill
                        tone={shard.isReady ? 'success' : 'danger'}
                        label={shard.isReady ? 'Ready' : 'Not ready'}
                      />
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-muted">Servers</dt>
                        <dd className="mt-0.5 font-medium text-ink">{formatNumber(shard.serverCount)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-muted">Cached users</dt>
                        <dd className="mt-0.5 font-medium text-ink">{formatNumber(shard.cachedUserCount)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-muted">Latency</dt>
                        <dd className="mt-0.5 font-medium text-ink">{Math.round(shard.latency)} ms</dd>
                      </div>
                    </dl>
                    {mapping ? (
                      <p className="mt-3 text-xs text-ink-muted">
                        {mapping.guildIds.length} server
                        {mapping.guildIds.length === 1 ? '' : 's'} mapped to this shard
                      </p>
                    ) : null}
                  </article>
                )
              })}
            </div>
          ) : (
            <InlineNotice className="mt-5" title="No shard data">
              The bot API responded but did not report any shards. This happens when the bot is
              still starting up.
            </InlineNotice>
          )}
        </section>

        <InlineNotice className="mt-10" title="How this page works">
          The bot exposes a small Flask service with <code>/status</code>, <code>/stats</code>,{' '}
          <code>/commands</code> and <code>/shards</code> routes. This page polls it through the
          site's own serverless proxy every twelve seconds and never reports a status it could not
          verify.
        </InlineNotice>
      </Container>
    </>
  )
}
