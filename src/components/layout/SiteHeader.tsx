import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from './Logo'
import { AccountMenu } from '../dashboard/AccountMenu'
import { ButtonLink } from '../ui/Button'
import { NAV_LINKS, SITE } from '../../lib/site'

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="rounded" aria-label="Bore home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden h-full items-center gap-5 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'relative flex h-full items-center text-base transition-colors',
                  isActive ? 'text-brand-700' : 'text-ink-soft hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-500" aria-hidden />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href={SITE.inviteUrl} external size="sm" className="hidden sm:inline-flex">
            Add to Discord
          </ButtonLink>

          <div className="hidden sm:block">
            <AccountMenu />
          </div>

          <Link
            to="/auth/login"
            className="rounded px-2 py-1 text-base text-ink-soft transition-colors hover:text-ink sm:hidden"
          >
            Sign in
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="rounded p-1.5 text-ink-soft transition-colors hover:bg-inset hover:text-ink md:hidden"
          >
            <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
            {mobileOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-navigation" className="border-t border-line bg-surface md:hidden animate-fade-in">
          <nav aria-label="Mobile" className="mx-auto flex max-w-5xl flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    'border-b border-line py-2.5 text-base transition-colors last:border-b-0',
                    isActive ? 'text-brand-700' : 'text-ink-soft',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link to="/auth/login" className="border-b border-line py-2.5 text-base text-ink-soft">
              Sign in
            </Link>
            <div className="py-2.5">
              <ButtonLink href={SITE.inviteUrl} external size="sm">
                Add to Discord
              </ButtonLink>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
