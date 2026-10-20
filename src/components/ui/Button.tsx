import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100',
  outline: 'border border-line bg-surface text-ink hover:border-brand-300 hover:text-brand-600',
  ghost: 'text-ink-soft hover:bg-brand-50 hover:text-brand-700',
  danger: 'bg-danger text-white hover:brightness-95',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props },
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
      {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
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
  variant = 'primary',
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
