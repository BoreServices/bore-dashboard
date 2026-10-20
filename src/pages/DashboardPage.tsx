import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bell,
  Compass,
  Flag,
  Gauge,
  Hammer,
  LayoutDashboard,
  ScrollText,
  Shield,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { Container, PageHeader } from '../components/layout/Container'
import { ButtonLink } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState, InlineNotice } from '../components/ui/States'
import { useGuildConfigQuery, useSessionQuery } from '../lib/queries'
import { formatNumber } from '../lib/format'
import { usePageMeta } from '../lib/usePageMeta'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard, ready: true },
  { label: 'Moderation', icon: Shield, ready: false },
  { label: 'Members', icon: Users, ready: false },
  { label: 'Automation', icon: Hammer, ready: false },
  { label: 'Logs', icon: ScrollText, ready: false },
]

const upcoming = [
  {
    icon: Flag,
    title: 'Moderation log',
    body: 'A searchable history of bans, kicks, warnings and timeouts, per channel.',
  },
  {
    icon: Gauge,
    title: 'Auto-mod rules',
    body: 'Spam, mention and invite protection with per-guild thresholds.',
  },
  {
    icon: Bell,
    title: 'Welcome and boost messages',
    body: 'Configure the messages Bore already sends, from one place.',
  },
  {
    icon: Activity,
    title: 'Server analytics',
    body: 'Activity, growth and command usage over time.',
  },
]

export function DashboardPage() {
  usePageMeta(
    'Dashboard · Bore',
    'The Bore dashboard is under active development. Sign in with Discord to see your servers.',
    '/dashboard',
  )

  const { data: session, isPending: sessionPending } = useSessionQuery()
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    setSelectedGuildId((current) => current ?? session.guilds[0]?.id ?? null)
  }, [session])

  const guildQuery = useGuildConfigQuery(selectedGuildId)
  const guilds = session?.guilds ?? []
  const selectedGuild = useMemo(
    () => guilds.find((guild) => guild.id === selectedGuildId) ?? null,
    [guilds, selectedGuildId],
  )

  if (sessionPending) {
    return (
      <Container className="py-16">
        <Skeleton className="h-10 w-64" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      </Container>
    )
  }

  if (!session) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<Users className="h-8 w-8" aria-hidden />}
          title="Sign in to open your dashboard"
          description="The dashboard uses your Discord session to show the servers you are in. Sign in with Discord to continue."
          action={
            <ButtonLink href="/auth/login?next=%2Fdashboard">
              Sign in with Discord
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          }
        />
      </Container>
    )
  }

  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-brand-50/60 to-canvas">
        <Container className="py-10">
          <PageHeader
            eyebrow="Dashboard"
            title="Your Bore dashboard"
            description="A work in progress. What exists today reads real data from Discord and the bot's database — everything else is on the roadmap."
            actions={
              <Badge tone="warning" className="px-3 py-1 text-xs">
                Work in progress
              </Badge>
            }
          />
        </Container>
      </div>

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="surface-card p-4">
              <div className="flex items-center gap-3">
                {session.user.avatar ? (
                  <img
                    src={session.user.avatar}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Users className="h-5 w-5" aria-hidden />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {session.user.globalName || session.user.username}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{session.user.id}</p>
                </div>
              </div>

              <nav aria-label="Dashboard sections" className="mt-4 space-y-1">
                {navigation.map((item) => (
                  <div
                    key={item.label}
                    aria-disabled={!item.ready}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
                      item.ready
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : 'cursor-not-allowed text-ink-muted',
                    )}
                  >
                    <item.icon className="h-4 w-4" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {!item.ready ? (
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                        Soon
                      </span>
                    ) : null}
                  </div>
                ))}
              </nav>

              <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3">
                <p className="text-xs font-medium text-brand-800">Heads up</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-800/80">
                  Nothing in the dashboard changes your server yet. Every section below reads live
                  data only.
                </p>
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <section className="surface-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Server</h2>
                  <p className="mt-1 text-xs text-ink-muted">
                    Choose one of the servers Discord reports for your account.
                  </p>
                </div>
                {guilds.length ? (
                  <div className="flex items-center gap-2">
                    <label htmlFor="guild-select" className="text-xs font-medium text-ink-muted">
                      Server
                    </label>
                    <select
                      id="guild-select"
                      value={selectedGuildId ?? ''}
                      onChange={(event) => setSelectedGuildId(event.target.value)}
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      {guilds.map((guild) => (
                        <option key={guild.id} value={guild.id}>
                          {guild.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              {guilds.length === 0 ? (
                <InlineNotice className="mt-5" title="No servers found">
                  {session.guildsAvailable === false
                    ? 'Discord could not be reached to list your servers. Try again in a moment.'
                    : 'Discord did not return any servers for this account. Bore only lists servers the bot can see, so add the bot to a server and sign in again.'}
                </InlineNotice>
              ) : null}

              {guildQuery.isPending && selectedGuild ? (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 w-full" />
                  ))}
                </div>
              ) : null}

              {guildQuery.isError ? (
                <ErrorState
                  className="mt-6"
                  title="Could not load this server"
                  description={
                    guildQuery.error instanceof Error
                      ? guildQuery.error.message
                      : 'The dashboard data could not be loaded.'
                  }
                  onRetry={() => guildQuery.refetch()}
                />
              ) : null}

              {guildQuery.data ? (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-line bg-canvas/50 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                      Server
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {guildQuery.data.guild.icon ? (
                        <img
                          src={guildQuery.data.guild.icon}
                          alt=""
                          className="h-7 w-7 rounded-lg object-cover"
                          width={28}
                          height={28}
                        />
                      ) : null}
                      <p className="truncate text-base font-semibold text-ink">
                        {guildQuery.data.guild.name}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">{guildQuery.data.guild.id}</p>
                    {guildQuery.data.guild.owner ? (
                      <Badge tone="brand" className="mt-3">
                        You own this server
                      </Badge>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-line bg-canvas/50 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                      Members
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink">
                      {guildQuery.data.guild.memberCount !== null
                        ? formatNumber(guildQuery.data.guild.memberCount)
                        : 'Not exposed'}
                    </p>
                    <p className="mt-2 text-xs text-ink-muted">
                      {guildQuery.data.guild.memberCount !== null
                        ? 'Approximate count reported by Discord.'
                        : 'Discord only returns member counts with extra permissions, which Bore does not request.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-line bg-canvas/50 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                      Command prefix
                    </p>
                    <p className="mt-2 font-mono text-base font-semibold text-ink">
                      {guildQuery.data.prefixSource === 'unavailable'
                        ? 'Unavailable'
                        : guildQuery.data.prefix}
                    </p>
                    <p className="mt-2 text-xs text-ink-muted">
                      {guildQuery.data.prefixSource === 'database'
                        ? 'Read from the bot database.'
                        : guildQuery.data.prefixSource === 'default'
                          ? 'No custom prefix set — the bot default is used.'
                          : 'The database is not configured for this deployment.'}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>

            <section aria-labelledby="upcoming-heading">
              <h2 id="upcoming-heading" className="text-lg font-semibold text-ink">
                Coming next
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                These panels are planned. Nothing here is live yet, so none of them pretend to
                change your server.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {upcoming.map((item) => (
                  <div
                    key={item.title}
                    className="relative overflow-hidden rounded-2xl border border-dashed border-line bg-surface/70 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                        <item.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <Badge tone="outline">Upcoming</Badge>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6">
              <h2 className="text-lg font-semibold text-ink">Meanwhile, Bore is ready to use</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-muted">
                The bot and its tools work today. Browse every command, or build an embed script
                while the dashboard is being finished.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink to="/commands" variant="primary">
                  <Compass className="h-4 w-4" aria-hidden />
                  Explore commands
                </ButtonLink>
                <ButtonLink to="/embed" variant="outline">
                  Open the embed builder
                </ButtonLink>
                <ButtonLink to="/status" variant="ghost">
                  Check bot status
                </ButtonLink>
              </div>
            </section>

            {selectedGuild ? (
              <p className="text-xs text-ink-muted">
                Signed in with Discord as{' '}
                <span className="font-medium text-ink">{session.user.username}</span>. Sign out from
                the avatar menu in the header.
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </>
  )
}
