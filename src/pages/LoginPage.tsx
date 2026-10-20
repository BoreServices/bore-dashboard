import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn, ShieldCheck } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { ButtonLink } from '../components/ui/Button'
import { Notice } from '../components/ui/States'
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
    'Discord sign-in is not configured on this deployment. Set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, SESSION_SECRET and SITE_URL.',
  oauth_error: 'Discord reported an error during sign-in.',
  oauth_failed: 'Discord sign-in could not be completed.',
}

export function LoginPage() {
  usePageMeta(
    'Sign in · Bore',
    'Sign in with Discord to open the Bore dashboard for the servers you manage.',
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
    <Container size="narrow" className="flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-sm">
        <div className="rounded border border-line bg-surface p-6">
          <div className="flex items-center gap-2.5">
            <BoreMark className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-ink">Sign in to Bore</h1>
              <p className="text-xs text-ink-muted">Discord OAuth2</p>
            </div>
          </div>

          {error ? (
            <Notice tone="danger" className="mt-4">
              {errorMessages[error] ?? 'Sign-in could not be completed.'}
            </Notice>
          ) : null}

          <ButtonLink
            href={`/api/auth/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            variant="primary"
            size="md"
            className="mt-5 w-full"
          >
            <LogIn className="h-3.5 w-3.5" aria-hidden />
            Continue with Discord
          </ButtonLink>

          {isPending ? (
            <p className="mt-3 text-center text-2xs text-ink-muted">Checking for an existing session…</p>
          ) : null}

          <ul className="mt-5 space-y-2 border-t border-line pt-4">
            {[
              'Requests identify and guilds only — never bot management scopes.',
              'Your session lives in an encrypted HTTP-only cookie; tokens never reach the browser.',
              'The dashboard shows the servers you manage and edits the settings Bore already stores for them.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-2xs leading-relaxed text-ink-muted">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-brand-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Just looking around?{' '}
          <Link to="/commands" className="text-brand-600 hover:underline">
            Browse the command directory
          </Link>{' '}
          or{' '}
          <Link to="/embed" className="text-brand-600 hover:underline">
            open the embed builder
          </Link>
          .
        </p>
      </div>
    </Container>
  )
}
