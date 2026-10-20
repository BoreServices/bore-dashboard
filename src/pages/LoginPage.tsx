import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, LogIn, ShieldCheck } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { ButtonLink } from '../components/ui/Button'
import { InlineNotice } from '../components/ui/States'
import { BoreMark } from '../components/layout/Logo'
import { useSessionQuery } from '../lib/queries'
import { safeNextPath } from '../lib/redirect'
import { usePageMeta } from '../lib/usePageMeta'

const errorMessages: Record<string, string> = {
  access_denied: 'You cancelled the Discord authorisation, so nothing was signed in.',
  invalid_state:
    'The sign-in request could not be verified. It may have expired — please try again.',
  missing_code: 'Discord did not return an authorisation code.',
  oauth_not_configured:
    'Discord sign-in is not configured on this deployment. Set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI and SESSION_SECRET.',
  oauth_error: 'Discord reported an error during sign-in.',
  oauth_failed: 'Discord sign-in could not be completed.',
}

export function LoginPage() {
  usePageMeta(
    'Sign in · Bore',
    'Sign in with Discord to access the Bore dashboard and the servers you manage.',
    '/auth/login',
  )

  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { data: session, isPending } = useSessionQuery()
  const error = params.get('error')
  const next = safeNextPath(params.get('next'))

  useEffect(() => {
    if (session) navigate(next ?? '/dashboard', { replace: true })
  }, [session, navigate, next])

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="surface-card p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <BoreMark className="h-9 w-9" />
          </span>

          <h1 className="mt-6 text-2xl font-semibold text-ink">Sign in to Bore</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Use Discord to sign in. Bore only reads your Discord identity and the list of servers
            you are in — it never needs permission to manage them.
          </p>

          {error ? (
            <InlineNotice tone="danger" className="mt-6 text-left">
              {errorMessages[error] ?? 'Sign-in could not be completed.'}
            </InlineNotice>
          ) : null}

          <ButtonLink
            href={`/api/auth/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            size="lg"
            className="mt-7 w-full"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Continue with Discord
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>

          {isPending ? (
            <p className="mt-4 text-xs text-ink-muted">Checking for an existing session…</p>
          ) : null}

          <ul className="mt-7 space-y-2 border-t border-line pt-6 text-left text-xs text-ink-muted">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
              Requests the <code className="font-mono">identify</code> scope (your username and
              avatar) and <code className="font-mono">guilds</code> (the servers you are in).
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
              Your session is stored in an encrypted, HTTP-only cookie. Tokens never reach the
              browser's JavaScript.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
              The dashboard is a work in progress — signing in does not change any server settings.
            </li>
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Just looking around?{' '}
          <Link to="/commands" className="font-medium text-brand-600 hover:underline">
            Browse the command directory
          </Link>{' '}
          or{' '}
          <Link to="/embed" className="font-medium text-brand-600 hover:underline">
            open the embed builder
          </Link>
          .
        </p>
      </div>
    </Container>
  )
}
