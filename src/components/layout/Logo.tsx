import clsx from 'clsx'

export function BoreMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx('h-6 w-6', className)} role="img" aria-label="Bore">
      <defs>
        <linearGradient id="bore-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8FB9F7" />
          <stop offset="100%" stopColor="#3B78D4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#bore-mark)" />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="#fff" strokeWidth="2" opacity="0.9" />
      <circle cx="16" cy="16" r="3" fill="#fff" />
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
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <BoreMark />
      {showWord ? (
        <span className="text-md font-semibold tracking-tight text-ink">Bore</span>
      ) : null}
    </span>
  )
}
