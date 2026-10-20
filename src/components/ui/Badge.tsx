import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export type BadgeTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'outline'

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  neutral: 'bg-canvas text-ink-soft border-line',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  outline: 'bg-transparent text-ink-muted border-line',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
