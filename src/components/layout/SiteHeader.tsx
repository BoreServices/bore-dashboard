import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Menu, Settings, User, X } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from './Logo'
import { ButtonLink } from '../ui/Button'
import { NAV_LINKS, SITE } from '../../lib/site'
import { useSessionQuery, queryKeys } from '../../lib/queries'

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSessionQuery()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
      navigate('/')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="rounded-lg" aria-label="Bore home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-canvas hover:text-ink',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink
            href={SITE.inviteUrl}
            external
            size="sm"
            className="hidden sm:inline-flex"
            aria-label="Add Bore to Discord"
          >
            Add to Discord
          </ButtonLink>

          {session ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-sm font-medium text-ink transition-colors hover:border-brand-300"
              >
                {session.user.avatar ? (
                  <img
                    src={session.user.avatar}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                    width={28}
                    height={28}
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <User className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <span className="hidden max-w-[9rem] truncate sm:inline">
                  {session.user.globalName || session.user.username}
                </span>
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-lift animate-fade-up"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">
                      {session.user.globalName || session.user.username}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{session.user.id}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
                  >
                    <Settings className="h-4 w-4" aria-hidden />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-ink sm:block"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-canvas hover:text-ink md:hidden"
          >
            <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-navigation" className="border-t border-line bg-surface md:hidden animate-fade-in">
          <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-canvas hover:text-ink',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/auth/login"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
            >
              Sign in
            </Link>
            <ButtonLink href={SITE.inviteUrl} external className="mt-2 sm:hidden">
              Add to Discord
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
