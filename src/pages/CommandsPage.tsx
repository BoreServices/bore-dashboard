import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Tag } from '../components/ui/Tag'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState, ErrorState, Notice } from '../components/ui/States'
import { CommandDetails } from '../components/commands/CommandDetails'
import { useCommandsQuery } from '../lib/queries'
import { categoryCounts, filterCategories } from '../lib/commands'
import { usePageMeta } from '../lib/usePageMeta'
import type { Command } from '../types/api'

export function CommandsPage() {
  usePageMeta(
    'Command directory · Bore',
    'Every command Bore ships, grouped by category with syntax, permissions, cooldowns and examples.',
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
      <div className="border-b border-line bg-canvas">
        <Container className="py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-muted">
                command directory
              </p>
              <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
                Everything the bot exposes
              </h1>
              <p className="mt-2 max-w-xl text-base text-ink-soft">
                Read straight from the running bot, so the list is never out of date.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search commands"
                aria-label="Search commands"
                className="h-8 w-full rounded border border-line-strong bg-surface pl-8 pr-2.5 text-base text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {isPending ? (
          <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
            <Skeleton className="h-48 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <ErrorState
            title="The command directory is unavailable"
            description={
              <>
                {error instanceof Error ? error.message : 'The bot API could not be reached.'}{' '}
                The bot API has to be reachable for the directory to load.
              </>
            }
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No commands match"
            description={
              query
                ? `Nothing in the directory matches “${query}”. Try a shorter query or clear the category filter.`
                : 'This category is empty.'
            }
            action={
              <Button
                variant="secondary"
                size="sm"
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
          <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
            <nav aria-label="Categories" className="lg:sticky lg:top-20 lg:self-start">
              <p className="mb-2 font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
                categories
              </p>
              <ul className="-mx-1 flex gap-1 overflow-x-auto lg:flex-col lg:gap-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setCategory(null)}
                    aria-current={category === null}
                    className={clsx(
                      'flex w-full items-center justify-between gap-2 whitespace-nowrap rounded px-2 py-1.5 text-left text-base transition-colors',
                      category === null
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : 'text-ink-soft hover:bg-inset hover:text-ink',
                    )}
                  >
                    <span>All</span>
                    <span className="font-mono text-2xs text-ink-faint">{data?.commandCount ?? 0}</span>
                  </button>
                </li>
                {counts.map((entry) => (
                  <li key={entry.name}>
                    <button
                      type="button"
                      onClick={() => setCategory(category === entry.name ? null : entry.name)}
                      aria-current={category === entry.name}
                      className={clsx(
                        'flex w-full items-center justify-between gap-2 whitespace-nowrap rounded px-2 py-1.5 text-left text-base capitalize transition-colors',
                        category === entry.name
                          ? 'bg-brand-50 font-medium text-brand-700'
                          : 'text-ink-soft hover:bg-inset hover:text-ink',
                      )}
                    >
                      <span>{entry.name}</span>
                      <span className="font-mono text-2xs text-ink-faint">{entry.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0">
              <p className="mb-3 text-xs text-ink-muted">
                {totalResults} {totalResults === 1 ? 'command' : 'commands'}
                {query ? ` matching “${query}”` : ''}
                {category ? ` in ${category}` : ''}
              </p>

              <div className="overflow-hidden rounded border border-line bg-surface">
                {filtered.map((entry) => (
                  <section key={entry.name}>
                    <h2 className="border-b border-line bg-inset px-3 py-1.5 font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
                      {entry.name}
                    </h2>
                    <ul>
                      {entry.commands.map((command) => (
                        <li key={`${entry.name}-${command.name}`}>
                          <button
                            type="button"
                            onClick={() => setSelected(command)}
                            className="group grid w-full grid-cols-1 items-baseline gap-x-6 gap-y-1 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-inset sm:grid-cols-[13rem_1fr_auto]"
                          >
                            <span className="font-mono text-base text-brand-700 group-hover:text-brand-600">
                              {command.name}
                            </span>
                            <span className="text-base leading-relaxed text-ink-soft">
                              {command.description ?? 'No description provided.'}
                            </span>
                            <span className="flex flex-wrap gap-1">
                              {command.aliases.slice(0, 2).map((alias) => (
                                <Tag key={alias} tone="outline">
                                  {alias}
                                </Tag>
                              ))}
                              {command.permissions.length ? (
                                <Tag tone="neutral">{command.permissions[0]}</Tag>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <Notice className="mt-4">
                Missing metadata is shown as “None” rather than guessed. Values come from the
                bot's own command objects.
              </Notice>
            </div>
          </div>
        )}
      </Container>

      <CommandDetails command={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </>
  )
}
