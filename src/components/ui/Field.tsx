import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { forwardRef, useId } from 'react'
import clsx from 'clsx'

const controlClass =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-canvas disabled:text-ink-muted'

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
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
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
      className={clsx(controlClass, error && 'border-danger focus:border-danger focus:ring-rose-100', className)}
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
      className={clsx(controlClass, 'resize-y', error && 'border-danger focus:border-danger', className)}
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
      className={clsx(controlClass, 'appearance-none bg-[length:16px] pr-9', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
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
        'flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-3.5 py-3',
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
          className="relative block h-5 w-9 rounded-full bg-line transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-brand-500 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300"
        />
      </span>
      <span className="order-first">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-ink-muted">{description}</span> : null}
      </span>
    </label>
  )
}
