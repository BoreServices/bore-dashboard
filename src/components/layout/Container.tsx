import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Container({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode
  className?: string
  size?: 'default' | 'wide' | 'narrow'
}) {
  return (
    <div
      className={clsx(
        'mx-auto w-full px-4 sm:px-6',
        size === 'wide' ? 'max-w-7xl' : size === 'narrow' ? 'max-w-3xl' : 'max-w-5xl',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-muted">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-2 text-base leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
