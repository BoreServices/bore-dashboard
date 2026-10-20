import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export type TagTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'outline'

const tones: Record<TagTone, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  neutral: 'bg-inset text-ink-muted border-line',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  outline: 'bg-transparent text-ink-muted border-line',
}

/** Small, square-cornered label. Not a pill. */
export function Tag({
  tone = 'neutral',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: TagTone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-px text-2xs font-medium leading-4',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
