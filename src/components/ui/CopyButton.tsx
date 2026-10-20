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
  variant?: 'ghost' | 'outline'
  onCopied?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const variants = {
    ghost: 'text-ink-muted hover:bg-inset hover:text-ink',
    outline: 'border border-line-strong bg-surface text-ink-soft hover:border-brand-300 hover:text-brand-700',
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
        'inline-flex h-6 items-center gap-1 rounded px-1.5 text-2xs font-medium transition-colors',
        variants[variant],
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  )
}

export function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <pre
      className={clsx(
        'overflow-x-auto rounded border border-line bg-inset px-3 py-2.5 font-mono text-sm leading-relaxed text-ink',
        className,
      )}
    >
      {children}
    </pre>
  )
}
