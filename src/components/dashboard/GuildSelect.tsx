import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, RefreshCw, Search } from 'lucide-react'
import clsx from 'clsx'
import type { DashboardGuild } from '../../types/dashboard'

export function GuildSelect({
  guilds,
  selectedId,
  onSelect,
  onRefresh,
  loading,
}: {
  guilds: DashboardGuild[]
  selectedId: string | null
  onSelect: (guildId: string) => void
  onRefresh: () => void
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = needle
      ? guilds.filter((guild) => guild.name.toLowerCase().includes(needle))
      : guilds
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [guilds, query])

  const selected = guilds.find((guild) => guild.id === selectedId) ?? null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-7 max-w-[16rem] items-center gap-1.5 rounded border border-line bg-surface px-1.5 text-base transition-colors hover:border-line-strong"
      >
        {selected?.icon ? (
          <img src={selected.icon} alt="" className="h-4 w-4 rounded-sm object-cover" />
        ) : (
          <span className="h-4 w-4 rounded-sm bg-line" aria-hidden />
        )}
        <span className="truncate font-medium text-ink">
          {selected?.name ?? (loading ? 'Loading…' : 'Select a server')}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 text-ink-muted" aria-hidden />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded border border-line bg-surface shadow-pop animate-fade-up">
          <div className="border-b border-line p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-faint"
                aria-hidden
              />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search servers"
                aria-label="Search servers"
                className="h-7 w-full rounded border border-line-strong bg-surface pl-7 pr-2 text-base placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-ink-muted">
                {guilds.length === 0
                  ? 'Discord did not return any servers for this account.'
                  : 'No server matches that search.'}
              </li>
            ) : (
              filtered.map((guild) => (
                <li key={guild.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={guild.id === selectedId}
                    onClick={() => {
                      onSelect(guild.id)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={clsx(
                      'flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors',
                      guild.id === selectedId ? 'bg-brand-50' : 'hover:bg-inset',
                    )}
                  >
                    {guild.icon ? (
                      <img src={guild.icon} alt="" className="h-5 w-5 rounded-sm object-cover" />
                    ) : (
                      <span className="h-5 w-5 rounded-sm bg-line" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate text-base text-ink">{guild.name}</span>
                    {guild.botInstalled === false ? (
                      <span className="rounded-sm border border-line px-1 py-px text-[10px] text-ink-muted">
                        not installed
                      </span>
                    ) : null}
                    {guild.id === selectedId ? (
                      <Check className="h-3 w-3 text-brand-600" aria-hidden />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-line px-2 py-1.5">
            <button
              type="button"
              onClick={() => {
                onRefresh()
                setOpen(false)
              }}
              className="flex items-center gap-1.5 px-1 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <RefreshCw className="h-3 w-3" aria-hidden />
              Refresh server list
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
