import clsx from 'clsx'

export function BoreMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={clsx('h-8 w-8', className)} role="img" aria-label="Bore">
      <defs>
        <linearGradient id="bore-mark-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8FB8FA" />
          <stop offset="100%" stopColor="#3C7BE0" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#bore-mark-gradient)" />
      <circle cx="20" cy="20" r="9.5" fill="none" stroke="#FFFFFF" strokeWidth="2.4" opacity="0.95" />
      <circle cx="20" cy="20" r="4" fill="#FFFFFF" />
      <path d="M20 6.5v3M20 30.5v3M6.5 20h3M30.5 20h3" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

export function Logo({
  className,
  showWord = true,
}: {
  className?: string
  showWord?: boolean
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <BoreMark className="h-8 w-8" />
      {showWord ? (
        <span className="text-lg font-semibold tracking-tight text-ink">
          Bore
          <span className="ml-1 align-middle text-[10px] font-medium uppercase tracking-[0.18em] text-brand-500">
            bot
          </span>
        </span>
      ) : null}
    </span>
  )
}
