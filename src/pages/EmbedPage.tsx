import { useCallback, useEffect, useMemo, useState } from 'react'
import { Braces, Copy, Download, FileJson, RotateCcw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { Notice } from '../components/ui/States'
import { EmbedPreview } from '../components/embed/EmbedPreview'
import { FieldEditor } from '../components/embed/FieldEditor'
import { ButtonEditor } from '../components/embed/ButtonEditor'
import { PLACEHOLDERS } from '../lib/placeholders'
import {
  emptyEmbed,
  isHexColor,
  normalizeColor,
  parseEmbed,
  sampleEmbed,
  serializeEmbed,
  serializeConflicts,
  toDiscordJson,
  validateEmbed,
  type EmbedConfig,
} from '../lib/embed'
import { copyToClipboard } from '../lib/clipboard'
import { usePageMeta } from '../lib/usePageMeta'

const DRAFT_KEY = 'bore.embed.draft.v1'

function loadDraft(): EmbedConfig | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<EmbedConfig>
    if (!parsed || typeof parsed !== 'object') return null
    const base = emptyEmbed()
    return {
      ...base,
      ...parsed,
      fields: Array.isArray(parsed.fields) ? parsed.fields : base.fields,
      buttons: Array.isArray(parsed.buttons) ? parsed.buttons : base.buttons,
    }
  } catch {
    return null
  }
}

function Group({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-line px-4 py-4 last:border-b-0">
      <h3 className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">{title}</h3>
      {description ? <p className="mt-1 text-xs text-ink-muted">{description}</p> : null}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

export function EmbedPage() {
  usePageMeta(
    'Embed builder · Bore',
    'Build Discord embeds with a live preview and export them in the exact script format the Bore bot understands.',
    '/embed',
  )

  const [config, setConfig] = useState<EmbedConfig>(() => loadDraft() ?? sampleEmbed())
  const [sample, setSample] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importValue, setImportValue] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [tab, setTab] = useState<'editor' | 'output'>('editor')

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(config))
    } catch {
      // Private mode or a full quota — the builder still works in memory.
    }
  }, [config])

  const patch = useCallback((values: Partial<EmbedConfig>) => {
    setConfig((current) => ({ ...current, ...values }))
  }, [])

  const script = useMemo(() => serializeEmbed(config), [config])
  const json = useMemo(() => JSON.stringify(toDiscordJson(config), null, 2), [config])
  const issues = useMemo(() => validateEmbed(config), [config])
  const conflicts = useMemo(() => serializeConflicts(config), [config])
  const errors = issues.filter((issue) => issue.severity === 'error')

  const copyScript = async () => {
    const ok = await copyToClipboard(script)
    toast[ok ? 'success' : 'error'](ok ? 'Embed script copied' : 'Could not access the clipboard')
  }

  const copyJson = async () => {
    const ok = await copyToClipboard(json)
    toast[ok ? 'success' : 'error'](ok ? 'JSON copied' : 'Could not access the clipboard')
  }

  const downloadJson = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'bore-embed.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    toast.success('Embed JSON downloaded')
  }

  const applyImport = () => {
    const result = parseEmbed(importValue)
    const imported = result.config
    const hasContent = Boolean(
      imported.title ||
        imported.description ||
        imported.content ||
        imported.image ||
        imported.thumbnail ||
        imported.authorName ||
        imported.authorIcon ||
        imported.footerText ||
        imported.footerIcon ||
        imported.fields.length ||
        imported.buttons.length,
    )
    if (!hasContent) {
      toast.error('Nothing importable found in that script')
      return
    }
    setConfig(imported)
    setImportOpen(false)
    setImportValue('')
    toast.success('Embed script imported', {
      description: result.warnings[0] ?? 'The script was read with the bot parser.',
    })
  }

  const reset = (withSample: boolean) => {
    setConfig(withSample ? sampleEmbed() : emptyEmbed())
    setResetOpen(false)
    toast.success(withSample ? 'Example embed restored' : 'Builder cleared')
  }

  const clearDraft = () => {
    setConfig(emptyEmbed())
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
    toast.success('Draft cleared')
  }

  return (
    <>
      <div className="border-b border-line bg-canvas">
        <Container className="py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-muted">
                embed builder
              </p>
              <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
                Compose a Discord embed
              </h1>
              <p className="mt-2 max-w-xl text-base text-ink-soft">
                The output is the exact script format the bot parses — copy it straight into an
                embed command.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-3 w-3" aria-hidden />
                Import
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setResetOpen(true)}>
                <RotateCcw className="h-3 w-3" aria-hidden />
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={copyScript}
                disabled={errors.length > 0}
              >
                <Copy className="h-3 w-3" aria-hidden />
                Copy script
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {errors.length ? (
          <Notice tone="danger" className="mb-4" title={`${errors.length} issue${errors.length > 1 ? 's' : ''} to fix`}>
            <ul className="list-disc space-y-0.5 pl-4">
              {errors.map((issue) => (
                <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          </Notice>
        ) : null}

        {conflicts.length ? (
          <Notice tone="warning" className="mb-4" title="Separator conflict">
            {conflicts.join(', ')} contain “&amp;&amp;”, which the bot uses as a separator inside
            fields, footers, authors and buttons. Those values may not survive a round trip.
          </Notice>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0">
            <div className="mb-4 flex gap-1 border-b border-line">
              {(['editor', 'output'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  aria-current={tab === value}
                  className={`-mb-px border-b-2 px-3 py-1.5 text-base capitalize transition-colors ${
                    tab === value
                      ? 'border-brand-500 font-medium text-brand-700'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {value === 'editor' ? 'Editor' : 'Output'}
                </button>
              ))}
            </div>

            {tab === 'editor' ? (
              <div className="overflow-hidden rounded border border-line bg-surface">
                <Group title="message">
                  <Textarea
                    rows={3}
                    maxLength={2000}
                    value={config.content}
                    placeholder="Text shown above the embed"
                    aria-label="Message content"
                    onChange={(event) => patch({ content: event.target.value })}
                  />
                </Group>

                <Group title="embed">
                  <Input
                    label="Title"
                    maxLength={256}
                    value={config.title}
                    onChange={(event) => patch({ title: event.target.value })}
                  />
                  <Textarea
                    label="Description"
                    rows={4}
                    maxLength={4096}
                    value={config.description}
                    onChange={(event) => patch({ description: event.target.value })}
                  />

                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-ink-soft">Colour</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="color"
                        aria-label="Pick embed colour"
                        value={isHexColor(config.color) ? normalizeColor(config.color) : '#78A9F5'}
                        onChange={(event) => patch({ color: event.target.value.toUpperCase() })}
                        className="h-7 w-10 cursor-pointer rounded border border-line bg-surface p-0.5"
                      />
                      <input
                        type="text"
                        aria-label="Embed colour hex value"
                        value={config.color}
                        onChange={(event) => patch({ color: event.target.value })}
                        className="h-7 w-32 rounded border border-line-strong bg-surface px-2 font-mono text-base uppercase focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                      {!isHexColor(config.color) ? (
                        <span className="text-2xs font-medium text-danger">
                          Use a hex value such as #78A9F5
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <Input
                    label="Image URL"
                    value={config.image}
                    placeholder="https://example.com/image.png"
                    onChange={(event) => patch({ image: event.target.value })}
                  />
                  <Input
                    label="Thumbnail URL"
                    value={config.thumbnail}
                    placeholder="https://example.com/thumbnail.png"
                    onChange={(event) => patch({ thumbnail: event.target.value })}
                  />
                </Group>

                <Group title="author">
                  <Input
                    label="Name"
                    maxLength={256}
                    value={config.authorName}
                    onChange={(event) => patch({ authorName: event.target.value })}
                  />
                  <Input
                    label="Icon URL"
                    value={config.authorIcon}
                    placeholder="https://example.com/avatar.png"
                    onChange={(event) => patch({ authorIcon: event.target.value })}
                  />
                  <Input
                    label="Link"
                    value={config.authorUrl}
                    placeholder="https://example.com"
                    onChange={(event) => patch({ authorUrl: event.target.value })}
                  />
                </Group>

                <Group title="footer">
                  <Input
                    label="Text"
                    maxLength={2048}
                    value={config.footerText}
                    onChange={(event) => patch({ footerText: event.target.value })}
                  />
                  <Input
                    label="Icon URL"
                    value={config.footerIcon}
                    placeholder="https://example.com/icon.png"
                    onChange={(event) => patch({ footerIcon: event.target.value })}
                  />
                </Group>

                <Group
                  title="fields"
                  description="Discord supports up to 25 fields, three per row when inline."
                >
                  <FieldEditor fields={config.fields} onChange={(fields) => patch({ fields })} />
                </Group>

                <Group
                  title="buttons"
                  description="Up to five link buttons per message. Discord renders link buttons in its default grey style."
                >
                  <ButtonEditor buttons={config.buttons} onChange={(buttons) => patch({ buttons })} />
                </Group>

                <Group
                  title="placeholders"
                  description="Resolved by the bot when the script is sent. Click to append to the description."
                >
                  <div className="grid gap-1 sm:grid-cols-2">
                    {PLACEHOLDERS.map((placeholder) => (
                      <button
                        key={placeholder.token}
                        type="button"
                        onClick={() =>
                          patch({ description: `${config.description}${placeholder.token}` })
                        }
                        title={`Insert ${placeholder.token}`}
                        className="flex items-center justify-between gap-3 rounded border border-line bg-inset px-2 py-1 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/60"
                      >
                        <code className="font-mono text-2xs text-brand-700">{placeholder.token}</code>
                        <span className="truncate text-2xs text-ink-muted">
                          {placeholder.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </Group>
              </div>
            ) : (
              <div className="space-y-4">
                <section className="overflow-hidden rounded border border-line bg-surface">
                  <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                    <h2 className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
                      embed script
                    </h2>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={copyScript}
                      disabled={errors.length > 0}
                    >
                      <Copy className="h-3 w-3" aria-hidden />
                      Copy
                    </Button>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all px-3 py-3 font-mono text-sm leading-relaxed text-ink">
                    {script}
                  </pre>
                </section>

                <section className="overflow-hidden rounded border border-line bg-surface">
                  <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                    <h2 className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
                      json payload
                    </h2>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={copyJson}>
                        <Copy className="h-3 w-3" aria-hidden />
                        Copy
                      </Button>
                      <Button size="sm" variant="secondary" onClick={downloadJson}>
                        <Download className="h-3 w-3" aria-hidden />
                        Export
                      </Button>
                    </div>
                  </div>
                  <pre className="max-h-96 overflow-auto px-3 py-3 font-mono text-sm leading-relaxed text-ink">
                    {json}
                  </pre>
                </section>

                <Notice>
                  The bot API exposes no send endpoint, so this builder never claims to deliver a
                  message to Discord. Copy the script into the bot's embed command, or export the
                  JSON for a tool that can post it.
                </Notice>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="lg:sticky lg:top-20">
              <EmbedPreview config={config} sample={sample} onToggleSample={setSample} />

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Button variant="secondary" size="sm" onClick={copyScript} disabled={errors.length > 0}>
                  <Braces className="h-3 w-3" aria-hidden />
                  Copy script
                </Button>
                <Button variant="secondary" size="sm" onClick={copyJson}>
                  <FileJson className="h-3 w-3" aria-hidden />
                  Copy JSON
                </Button>
                <Button variant="ghost" size="sm" onClick={clearDraft}>
                  <RotateCcw className="h-3 w-3" aria-hidden />
                  Clear draft
                </Button>
              </div>

              <p className="mt-3 text-2xs leading-relaxed text-ink-muted">
                Placeholders are shown literally unless sample values are switched on. Only the bot,
                running inside Discord, can resolve them for real. The draft is stored in this
                browser only.
              </p>
            </div>
          </div>
        </div>
      </Container>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import an embed script"
        description="Paste a script in the bot's format. Parts the builder does not understand are reported."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={applyImport}>
              Import
            </Button>
          </div>
        }
      >
        <Textarea
          rows={8}
          value={importValue}
          placeholder="{embed}$v{title:Hello}$v{description:World}"
          onChange={(event) => setImportValue(event.target.value)}
          label="Embed script"
        />
        <p className="mt-3 text-xs text-ink-muted">
          Scripts use <code className="font-mono">$v</code> between parts and{' '}
          <code className="font-mono">{'{embed}'}</code> as the marker.
        </p>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset the builder"
        description="This replaces the current draft and clears the copy stored in this browser."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => reset(true)}>
              Load example
            </Button>
            <Button variant="danger" size="sm" onClick={() => reset(false)}>
              Start empty
            </Button>
          </div>
        }
      >
        <p className="text-base text-ink-soft">
          Choose the example embed to start from a filled-in template, or start from an empty embed.
        </p>
      </Modal>
    </>
  )
}
