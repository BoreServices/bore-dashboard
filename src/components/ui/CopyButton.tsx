import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import clsx from 'clsx'
import { copyToClipboard } from '../../lib/clipboard'

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  className,
  variant = 'ghost',
  onCopied,
}: {
  value: string
  label?: string
  copiedLabel?: string
  className?: string
  variant?: 'ghost' | 'outline' | 'secondary'
  onCopied?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const variants = {
    ghost: 'text-ink-soft hover:bg-brand-50 hover:text-brand-700',
    outline: 'border border-line bg-surface text-ink hover:border-brand-300 hover:text-brand-600',
    secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100',
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(value)
    if (!ok) {
      toast.error('Could not access the clipboard')
      return
    }
    setCopied(true)
    onCopied?.()
    toast.success(copiedLabel)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
        variants[variant],
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  )
}

export function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <pre
      className={clsx(
        'overflow-x-auto rounded-xl border border-line bg-canvas px-4 py-3 font-mono text-xs leading-relaxed text-ink',
        className,
      )}
    >
      {children}
    </pre>
  )
}
