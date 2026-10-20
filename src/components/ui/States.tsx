import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Button } from './Button'

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('px-4 py-10 text-center', className)}>
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-muted">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Retry',
  className,
}: {
  title?: string
  description: ReactNode
  onRetry?: () => void
  retryLabel?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={clsx('rounded border border-danger/25 bg-danger/[0.04] px-4 py-5', className)}
    >
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-soft">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success'
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  const tones = {
    info: 'border-brand-100 bg-brand-50/60 text-brand-900',
    warning: 'border-amber-100 bg-amber-50/60 text-amber-900',
    danger: 'border-danger/25 bg-danger/[0.04] text-ink',
    success: 'border-emerald-100 bg-emerald-50/60 text-emerald-900',
  }
  return (
    <div className={clsx('rounded border px-3 py-2.5 text-xs leading-relaxed', tones[tone], className)}>
      {title ? <p className="mb-1 text-base font-medium">{title}</p> : null}
      {children}
    </div>
  )
}
