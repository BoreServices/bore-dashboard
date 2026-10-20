import { useMemo, useState } from 'react'
import { Search, SearchX, Terminal } from 'lucide-react'
import clsx from 'clsx'
import { Container, PageHeader } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState, InlineNotice } from '../components/ui/States'
import { CommandDetails } from '../components/commands/CommandDetails'
import { CommandSyntax } from '../components/commands/CommandSyntax'
import { useCommandsQuery } from '../lib/queries'
import { categoryCounts, filterCategories } from '../lib/commands'
import { usePageMeta } from '../lib/usePageMeta'
import type { Command } from '../types/api'

export function CommandsPage() {
  usePageMeta(
    'Command directory · Bore',
    'Browse every command Bore ships, grouped by category with syntax, permissions, cooldowns and examples.',
    '/commands',
  )

  const { data, isPending, isError, error, refetch } = useCommandsQuery()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [selected, setSelected] = useState<Command | null>(null)

  const categories = data?.categories ?? []
  const counts = useMemo(() => categoryCounts(categories), [categories])
  const filtered = useMemo(
    () => filterCategories(categories, { query, category }),
    [categories, query, category],
  )

  const totalResults = filtered.reduce((sum, entry) => sum + entry.commands.length, 0)

  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-brand-50/60 to-canvas">
        <Container className="py-12">
          <PageHeader
            eyebrow="Command directory"
            title="Every command Bore ships"
            description="This directory is generated from the running bot, so new commands show up here without any changes to the site."
          />
        </Container>
      </div>

      <Container className="py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commands, permissions, aliases…"
              aria-label="Search commands"
              className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted/70 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-pressed={category === null}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                category === null
                  ? 'border-brand-200 bg-brand-50 text-brand-700'
                  : 'border-line bg-surface text-ink-muted hover:border-brand-200 hover:text-ink',
              )}
            >
              All
              {data ? <span className="ml-1.5 text-[11px] opacity-70">{data.commandCount}</span> : null}
            </button>
            {counts.map((entry) => (
              <button
                key={entry.name}
                type="button"
                onClick={() => setCategory(category === entry.name ? null : entry.name)}
                aria-pressed={category === entry.name}
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  category === entry.name
                    ? 'border-brand-200 bg-brand-50 text-brand-700'
                    : 'border-line bg-surface text-ink-muted hover:border-brand-200 hover:text-ink',
                )}
              >
                {entry.name}
                <span className="ml-1.5 text-[11px] opacity-70">{entry.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {isPending ? (
            <div className="space-y-8">
              {[0, 1].map((group) => (
                <div key={group}>
                  <Skeleton className="h-5 w-40" />
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="surface-card space-y-3 p-5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="The command directory is unavailable"
              description={
                <>
                  {error instanceof Error ? error.message : 'The bot API could not be reached.'}{' '}
                  This usually means the bot API is offline or <code>BOT_API_BASE_URL</code> is not
                  configured for this deployment.
                </>
              }
              onRetry={() => refetch()}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-8 w-8" aria-hidden />}
              title="No commands match your search"
              description={
                query
                  ? `Nothing in the directory matches “${query}”. Try a shorter query or clear the category filter.`
                  : 'There are no commands in this category yet.'
              }
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setCategory(null)
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="space-y-10">
              <p className="text-sm text-ink-muted">
                Showing <span className="font-medium text-ink">{totalResults}</span>{' '}
                {totalResults === 1 ? 'command' : 'commands'}
                {query ? ` matching “${query}”` : ''}
                {category ? ` in ${category}` : ''}.
              </p>

              {filtered.map((entry) => (
                <section key={entry.name} aria-labelledby={`category-${entry.name}`}>
                  <div className="flex items-center gap-3">
                    <h2
                      id={`category-${entry.name}`}
                      className="text-lg font-semibold capitalize text-ink"
                    >
                      {entry.name}
                    </h2>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {entry.commands.length}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {entry.commands.map((command) => (
                      <button
                        key={`${entry.name}-${command.name}`}
                        type="button"
                        onClick={() => setSelected(command)}
                        className="group surface-card flex flex-col gap-2.5 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift focus-visible:-translate-y-0.5"
                      >
                        <span className="flex items-center gap-2">
                          <Terminal className="h-3.5 w-3.5 text-brand-500" aria-hidden />
                          <CommandSyntax syntax={command.syntax} name={command.name} />
                        </span>
                        <span className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
                          {command.description ?? 'No description provided.'}
                        </span>
                        {command.aliases.length ? (
                          <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                            {command.aliases.slice(0, 3).map((alias) => (
                              <Badge key={alias} tone="outline">
                                {alias}
                              </Badge>
                            ))}
                            {command.aliases.length > 3 ? (
                              <Badge tone="outline">+{command.aliases.length - 3}</Badge>
                            ) : null}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {data && data.commandCount > 0 ? (
          <InlineNotice className="mt-10" title="About this directory">
            Commands are grouped by the bot's own cog names. Values the bot does not publish are
            shown as “None” rather than being filled in with guesses.
          </InlineNotice>
        ) : null}
      </Container>

      <CommandDetails command={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </>
  )
}
