import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { forwardRef, useId } from 'react'
import clsx from 'clsx'

const controlClass =
  'w-full rounded border border-line-strong bg-surface px-2.5 py-1.5 text-base text-ink placeholder:text-ink-faint transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-inset disabled:text-ink-muted'

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-medium text-ink-soft">
          {label}
        </label>
        {hint ? <span className="text-2xs text-ink-muted">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-2xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Settings layout: a fixed label column and a control column, separated by a
 * hairline. Used across the dashboard configuration pages.
 */
export function SettingRow({
  label,
  description,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode
  description?: ReactNode
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'grid gap-x-6 gap-y-2 border-b border-line py-3.5 last:border-b-0 md:grid-cols-[15rem_1fr] md:items-start',
        className,
      )}
    >
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-base font-medium text-ink">
          {label}
        </label>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const control = (
    <input
      ref={ref}
      id={inputId}
      aria-invalid={error ? true : undefined}
      className={clsx(
        controlClass,
        'h-8',
        error && 'border-danger focus:border-danger focus:ring-rose-100',
        className,
      )}
      {...props}
    />
  )

  if (!label && !hint && !error) return control

  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      {control}
    </Field>
  )
})

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 4, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const control = (
    <textarea
      ref={ref}
      id={inputId}
      rows={rows}
      aria-invalid={error ? true : undefined}
      className={clsx(
        controlClass,
        'resize-y font-mono text-sm leading-relaxed',
        error && 'border-danger focus:border-danger',
        className,
      )}
      {...props}
    />
  )

  if (!label && !hint && !error) return control

  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      {control}
    </Field>
  )
})

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const control = (
    <select
      ref={ref}
      id={inputId}
      className={clsx(controlClass, 'h-8 pr-7', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23758196' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
      {...props}
    >
      {children}
    </select>
  )

  if (!label && !hint && !error) return control

  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      {control}
    </Field>
  )
})

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  return (
    <label
      className={clsx(
        'flex items-center justify-between gap-4 rounded border border-line bg-surface px-2.5 py-2',
        disabled && 'opacity-60',
      )}
    >
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="order-last">
        <span
          aria-hidden
          className="relative block h-4 w-7 rounded-sm bg-line-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-sm after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-brand-500 peer-checked:after:translate-x-3 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300"
        />
      </span>
      <span className="order-first">
        <span className="block text-base font-medium text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-ink-muted">{description}</span> : null}
      </span>
    </label>
  )
}
