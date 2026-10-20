import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
export type ButtonSize = 'sm' | 'md'

const base =
  'inline-flex select-none items-center justify-center gap-1.5 rounded font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-brand-300 hover:text-brand-700',
  ghost: 'text-ink-soft hover:bg-inset hover:text-ink',
  danger: 'border border-danger/40 bg-surface text-danger hover:bg-danger/5',
  quiet: 'text-brand-600 underline-offset-2 hover:underline',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-sm',
  md: 'h-8 px-3 text-base',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  )
})

export type ButtonLinkProps = {
  to?: string
  href?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
  external?: boolean
  'aria-label'?: string
}

export function ButtonLink({
  to,
  href,
  variant = 'secondary',
  size = 'md',
  className,
  children,
  external,
  ...rest
}: ButtonLinkProps) {
  const classes = clsx(base, variants[variant], sizes[size], className)

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={to ?? '/'} className={classes} {...rest}>
      {children}
    </Link>
  )
}
