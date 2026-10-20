import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut } from 'lucide-react'
import { queryKeys, useSessionQuery } from '../../lib/queries'

export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSessionQuery()
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded border border-line py-1 pl-1 pr-1.5 transition-colors hover:border-line-strong"
      >
        {session.user.avatar ? (
          <img
            src={session.user.avatar}
            alt=""
            className="h-5 w-5 rounded-sm object-cover"
            width={20}
            height={20}
          />
        ) : (
          <span className="h-5 w-5 rounded-sm bg-brand-100" />
        )}
        <ChevronDown className="h-3 w-3 text-ink-muted" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded border border-line bg-surface py-1 shadow-pop animate-fade-up"
        >
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-base font-medium text-ink">
              {session.user.globalName || session.user.username}
            </p>
            <p className="truncate font-mono text-2xs text-ink-muted">{session.user.id}</p>
          </div>
          <Link
            to="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-base text-ink-soft transition-colors hover:bg-inset hover:text-ink"
          >
            Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-base text-ink-soft transition-colors hover:bg-inset hover:text-ink"
          >
            <LogOut className="h-3 w-3" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
