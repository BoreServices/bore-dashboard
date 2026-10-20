import { Link } from 'react-router-dom'
import { Compass, Home, SearchX } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { ButtonLink } from '../components/ui/Button'
import { BoreMark } from '../components/layout/Logo'
import { usePageMeta } from '../lib/usePageMeta'

export function NotFoundPage() {
  usePageMeta(
    'Page not found · Bore',
    'The page you were looking for does not exist.',
    '/404',
  )

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <BoreMark className="h-9 w-9" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          This page drilled too deep
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          The link may be out of date, or the page may have moved. The command directory and the
          embed builder are a good place to start.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/">
            <Home className="h-4 w-4" aria-hidden />
            Back home
          </ButtonLink>
          <ButtonLink to="/commands" variant="outline">
            <Compass className="h-4 w-4" aria-hidden />
            Command directory
          </ButtonLink>
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-muted">
          <SearchX className="h-3.5 w-3.5" aria-hidden />
          Looking for something specific?{' '}
          <Link to="/commands" className="font-medium text-brand-600 hover:underline">
            Search every command
          </Link>
          .
        </p>
      </div>
    </Container>
  )
}
