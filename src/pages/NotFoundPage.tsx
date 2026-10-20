import { Link } from 'react-router-dom'
import { Container } from '../components/layout/Container'
import { ButtonLink } from '../components/ui/Button'
import { BoreMark } from '../components/layout/Logo'
import { usePageMeta } from '../lib/usePageMeta'

export function NotFoundPage() {
  usePageMeta('Not found · Bore', 'The page you were looking for does not exist.', '/404')

  return (
    <Container size="narrow" className="flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
          <BoreMark className="h-6 w-6" />
        </span>
        <p className="mt-5 font-mono text-2xs uppercase tracking-[0.16em] text-ink-muted">404</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">Nothing here</h1>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          The link may be out of date, or the page may have moved. The command directory is a good
          place to start.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink to="/" variant="primary">
            Back home
          </ButtonLink>
          <ButtonLink to="/commands" variant="secondary">
            Command directory
          </ButtonLink>
        </div>
        <p className="mt-5 text-xs text-ink-muted">
          Looking for something specific?{' '}
          <Link to="/commands" className="text-brand-600 hover:underline">
            Search every command
          </Link>
          .
        </p>
      </div>
    </Container>
  )
}
