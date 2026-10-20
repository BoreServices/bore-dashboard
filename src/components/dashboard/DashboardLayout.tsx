import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Braces,
  Command as CommandIcon,
  Gauge,
  LogOut,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Siren,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '../layout/Logo'
import { AccountMenu } from './AccountMenu'
import { GuildSelect } from './GuildSelect'
import { DashboardProvider, useDashboard } from './DashboardContext'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys, useSessionQuery } from '../../lib/queries'

type NavItem = {
  to: string
  end: boolean
  label: string
  icon: typeof Gauge
  external?: boolean
}

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Server',
    items: [{ to: '/dashboard', end: true, label: 'Overview', icon: Gauge }],
  },
  {
    label: 'Settings',
    items: [
      { to: '/dashboard/general', end: false, label: 'General', icon: SlidersHorizontal },
      { to: '/dashboard/welcome', end: false, label: 'Welcome', icon: Sparkles },
      { to: '/dashboard/leave', end: false, label: 'Leave', icon: UserMinus },
      { to: '/dashboard/boost', end: false, label: 'Boosts', icon: Megaphone },
      { to: '/dashboard/autoroles', end: false, label: 'Auto roles', icon: UserPlus },
      { to: '/dashboard/aliases', end: false, label: 'Aliases', icon: MessageSquare },
    ],
  },
  {
    label: 'Protection',
    items: [
      { to: '/dashboard/antinuke', end: false, label: 'Anti-nuke', icon: ShieldAlert },
      { to: '/dashboard/honeypot', end: false, label: 'Honeypots', icon: Siren },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/embed', end: false, label: 'Embed builder', icon: Braces, external: true },
      { to: '/commands', end: false, label: 'Commands', icon: CommandIcon, external: true },
    ],
  },
]

function SidebarLink({
  to,
  end,
  label,
  icon: Icon,
  external,
}: {
  to: string
  end: boolean
  label: string
  icon: typeof Gauge
  external?: boolean
}) {
  const classes =
    'flex items-center gap-2 rounded px-2 py-1.5 text-base transition-colors'

  if (external) {
    return (
      <a href={to} className={clsx(classes, 'text-ink-soft hover:bg-inset hover:text-ink')}>
        <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
        {label}
      </a>
    )
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          classes,
          isActive
            ? 'bg-brand-50 font-medium text-brand-700'
            : 'text-ink-soft hover:bg-inset hover:text-ink',
        )
      }
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
      {label}
    </NavLink>
  )
}

/**
 * The signed-in account, with the way out. It sits at the bottom of the
 * sidebar so signing out never hides behind a menu.
 */
function AccountBlock() {
  const { data: session } = useSessionQuery()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  if (!session) return null

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
      navigate('/')
    }
  }

  return (
    <div className="border-t border-line px-3 py-3">
      <p className="truncate text-xs font-medium text-ink">
        {session.user.globalName || session.user.username}
      </p>
      <p className="truncate font-mono text-2xs text-ink-faint">{session.user.id}</p>
      <button
        type="button"
        onClick={signOut}
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-danger"
      >
        <LogOut className="h-3 w-3" aria-hidden />
        Sign out
      </button>
    </div>
  )
}

function Shell() {
  const { guilds, guildsPending, refreshGuilds, selectedGuildId, selectGuild } = useDashboard()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  const title = useMemo(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.to === location.pathname) return item.label
        if (!item.external && location.pathname.startsWith(item.to) && item.to !== '/dashboard') {
          return item.label
        }
      }
    }
    return 'Overview'
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="flex h-12 items-center gap-4 px-3 sm:px-4">
          <a href="/" className="flex items-center gap-2" aria-label="Bore home">
            <Logo showWord={false} />
            <span className="hidden text-base font-semibold tracking-tight text-ink sm:inline">
              Bore
            </span>
          </a>

          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />

          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 sm:flex">
            <span className="text-2xs uppercase tracking-[0.12em] text-ink-faint">dashboard</span>
            <span className="text-2xs text-ink-faint">/</span>
            <span className="truncate text-base font-medium text-ink">{title}</span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <GuildSelect
              guilds={guilds}
              selectedId={selectedGuildId}
              onSelect={selectGuild}
              onRefresh={refreshGuilds}
              loading={guildsPending}
            />
            <AccountMenu />
            <button
              type="button"
              onClick={() => setNavOpen((open) => !open)}
              aria-expanded={navOpen}
              aria-controls="dashboard-sections"
              className="rounded border border-line px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink lg:hidden"
            >
              Sections
            </button>
          </div>
        </div>

        {navOpen ? (
          <nav
            id="dashboard-sections"
            aria-label="Dashboard sections"
            className="space-y-4 border-b border-line bg-surface px-3 py-3 lg:hidden animate-fade-in"
          >
            {sections.map((section) => (
              <div key={section.label}>
                <p className="px-2 pb-1.5 font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <SidebarLink {...item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        ) : null}
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-52 shrink-0 border-r border-line bg-surface lg:block">
          <div className="sticky top-12 flex min-h-[calc(100vh-3rem)] flex-col">
            <nav aria-label="Dashboard" className="flex-1 space-y-5 px-2 py-4">
              {sections.map((section) => (
                <div key={section.label}>
                  <p className="px-2 pb-1.5 font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
                    {section.label}
                  </p>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <li key={item.to}>
                        <SidebarLink {...item} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <AccountBlock />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  const { data: session, isPending } = useSessionQuery()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-xs text-ink-muted">Checking your session…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth/login?next=%2Fdashboard" replace />
  }

  return (
    <DashboardProvider>
      <Shell />
    </DashboardProvider>
  )
}
