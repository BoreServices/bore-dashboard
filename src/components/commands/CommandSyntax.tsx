export function CommandSyntax({ syntax, name }: { syntax: string | null; name: string }) {
  const text = (syntax ?? name).trim()
  const [command, ...rest] = text.split(' ')

  return (
    <code className="font-mono text-[13px] text-ink">
      <span className="text-brand-600">{command}</span>
      {rest.length ? <span className="text-ink-muted"> {rest.join(' ')}</span> : null}
    </code>
  )
}
