import { Fragment, type ReactNode } from 'react'
import { isHttpUrl } from '../../lib/embed'

const INLINE_PATTERN =
  /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/g

/**
 * A deliberately small Discord-flavoured markdown renderer. It only ever
 * produces React elements, so no user supplied HTML is ever injected.
 */
export function Markdown({ children }: { children: string }) {
  const blocks = children.split('\n')
  const output: ReactNode[] = []

  blocks.forEach((line, index) => {
    if (line.startsWith('```')) {
      const buffer: string[] = []
      let cursor = index + 1
      while (cursor < blocks.length && !blocks[cursor].startsWith('```')) {
        buffer.push(blocks[cursor])
        cursor += 1
      }
      output.push(
        <pre
          key={index}
          className="my-1 overflow-x-auto rounded-lg bg-ink/5 px-3 py-2 font-mono text-[12px] leading-relaxed text-ink"
        >
          {buffer.join('\n')}
        </pre>,
      )
      index = cursor
      return
    }

    if (!line.trim()) {
      output.push(<div key={index} className="h-2" />)
      return
    }

    if (line.startsWith('> ')) {
      output.push(
        <blockquote key={index} className="my-1 border-l-4 border-line pl-3 text-ink-muted">
          {renderInline(line.slice(2))}
        </blockquote>,
      )
      return
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const size = heading[1].length === 1 ? 'text-lg' : heading[1].length === 2 ? 'text-base' : 'text-sm'
      output.push(
        <p key={index} className={`${size} mt-1 font-semibold text-ink`}>
          {renderInline(heading[2])}
        </p>,
      )
      return
    }

    output.push(
      <p key={index} className="whitespace-pre-wrap break-words">
        {renderInline(line)}
      </p>,
    )
  })

  return <>{output}</>
}

function renderInline(text: string): ReactNode {
  const parts = text.split(INLINE_PATTERN).filter((part) => part !== '')
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="markdown-code">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="markdown-strong">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length > 4) {
      return (
        <u key={index} className="markdown-strong">
          {part.slice(2, -2)}
        </u>
      )
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return (
        <s key={index} className="text-ink-muted">
          {part.slice(2, -2)}
        </s>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      if (!isHttpUrl(link[2])) return <Fragment key={index}>{link[0]}</Fragment>
      return (
        <a key={index} href={link[2]} target="_blank" rel="noreferrer noopener" className="markdown-link">
          {link[1]}
        </a>
      )
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}
