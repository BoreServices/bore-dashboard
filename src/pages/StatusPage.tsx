import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { StatusDot } from '../components/ui/StatusDot'
import { ErrorState, Notice } from '../components/ui/States'
import { useShardsQuery, useStatsQuery, useStatusQuery } from '../lib/queries'
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
    'Live shard health, latency and uptime for the Bore Discord bot, polled from the bot API.',
    '/status',
  )

  const status = useStatusQuery()
  const stats = useStatsQuery()
  const shardsQuery = useShardsQuery()
  const [, setTick] = useState(0)

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

  const tone =
    unreachable || overall === 'unknown'
      ? 'neutral'
      : meta.tone === 'success'
        ? 'success'
        : meta.tone === 'warning'
          ? 'warning'
          : 'danger'

  const figures = [
    { label: 'servers', value: stats.data ? formatNumber(stats.data.servers) : '—' },
    { label: 'members', value: stats.data ? formatNumber(stats.data.members) : '—' },
    { label: 'shards', value: summary.shards ? `${summary.ready}/${summary.shards}` : '—' },
    { label: 'avg latency', value: summary.shards ? `${Math.round(summary.averageLatency)} ms` : '—' },
    { label: 'peak latency', value: summary.shards ? `${Math.round(summary.highestLatency)} ms` : '—' },
    { label: 'uptime', value: uptime ? formatUptime(uptime) : '—' },
  ]

  return (
    <>
      <div className="border-b border-line bg-canvas">
        <Container className="py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-muted">
                service status
              </p>
              <div className="mt-2 flex items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight text-ink">
                  {unreachable ? 'Status unavailable' : meta.label}
                </h1>
                <StatusDot
                  tone={tone}
                  label={
                    unreachable
                      ? 'not verified'
                      : stale
                        ? 'stale'
                        : `verified ${formatRelativeTime(status.dataUpdatedAt)}`
                  }
                  pulse={!unreachable && !stale && overall === 'operational'}
                />
              </div>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-soft">
                {unreachable
                  ? 'The bot API could not be reached, so nothing below is verified. No assumption is made about the current state of the bot.'
                  : stale
                    ? 'This data was fetched more than thirty seconds ago and may no longer reflect the live state of the bot.'
                    : meta.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-2xs text-ink-muted">
                last check {status.dataUpdatedAt ? formatTimestamp(status.dataUpdatedAt) : '—'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void status.refetch()
                  void stats.refetch()
                }}
                loading={status.isFetching}
              >
                <RefreshCw className="h-3 w-3" aria-hidden />
                Refresh
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-line pb-6 sm:grid-cols-3 lg:grid-cols-6">
          {figures.map((figure) => (
            <div key={figure.label}>
              <dt className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-faint">
                {figure.label}
              </dt>
              <dd className="mt-1 font-mono text-lg tabular-nums text-ink">{figure.value}</dd>
            </div>
          ))}
        </dl>

        {unreachable ? (
          <ErrorState
            className="mt-6"
            title="The status API is not responding"
            description="The bot API has to be reachable for this page to say anything about the bot."
            onRetry={() => status.refetch()}
          />
        ) : null}

        <section className="mt-8" aria-labelledby="shards-heading">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="shards-heading" className="text-base font-semibold text-ink">
              Shards
            </h2>
            <p className="font-mono text-2xs text-ink-muted">
              {summary.shards ? `${summary.ready} of ${summary.shards} ready` : 'no shard data'}
            </p>
          </div>

          {shardList && shardList.length ? (
            <div className="overflow-hidden rounded border border-line bg-surface">
              <Table>
                <thead>
                  <tr>
                    <Th className="w-24">shard</Th>
                    <Th className="w-32">state</Th>
                    <Th className="w-28 text-right">servers</Th>
                    <Th className="w-32 text-right">cached users</Th>
                    <Th className="w-28 text-right">latency</Th>
                    <Th className="text-right">guilds mapped</Th>
                  </tr>
                </thead>
                <tbody>
                  {shardList.map((shard) => {
                    const mapping = shardsQuery.data?.shards.find(
                      (entry) => entry.shardId === shard.shardId,
                    )
                    return (
                      <Tr key={shard.shardId}>
                        <Td className="font-mono text-base text-ink">#{shard.shardId}</Td>
                        <Td>
                          <StatusDot
                            tone={shard.isReady ? 'success' : 'danger'}
                            label={shard.isReady ? 'ready' : 'not ready'}
                          />
                        </Td>
                        <Td className="text-right font-mono tabular-nums">
                          {formatNumber(shard.serverCount)}
                        </Td>
                        <Td className="text-right font-mono tabular-nums">
                          {formatNumber(shard.cachedUserCount)}
                        </Td>
                        <Td className="text-right font-mono tabular-nums">
                          {Math.round(shard.latency)} ms
                        </Td>
                        <Td className="text-right font-mono tabular-nums text-ink-muted">
                          {mapping ? mapping.guildIds.length : '—'}
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <Notice title="No shard data">
              The bot API responded but did not report any shards, which happens while the bot is
              still starting up.
            </Notice>
          )}
        </section>

        <Notice className="mt-8">
          The bot exposes a small Flask service with <code className="font-mono">/status</code>,{' '}
          <code className="font-mono">/stats</code>, <code className="font-mono">/commands</code>{' '}
          and <code className="font-mono">/shards</code>. This page polls it through the site's own
          serverless proxy every twelve seconds and never reports a status it could not verify.
        </Notice>
      </Container>
    </>
  )
}
