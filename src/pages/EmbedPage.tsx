import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Braces,
  Check,
  Copy,
  Download,
  FileJson,
  Info,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { Container, PageHeader } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { InlineNotice } from '../components/ui/States'
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
    const hasContent =
      Boolean(
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
      <div className="border-b border-line bg-gradient-to-b from-brand-50/60 to-canvas">
        <Container className="py-12">
          <PageHeader
            eyebrow="Embed builder"
            title="Build a Discord embed"
            description="Compose an embed visually, watch it render the way Discord does, then copy the script the bot understands."
            actions={
              <>
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4" aria-hidden />
                  Import
                </Button>
                <Button variant="outline" onClick={() => setResetOpen(true)}>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </Button>
                <Button onClick={copyScript} disabled={errors.length > 0}>
                  <Copy className="h-4 w-4" aria-hidden />
                  Copy script
                </Button>
              </>
            }
          />
        </Container>
      </div>

      <Container className="py-10">
        {errors.length ? (
          <InlineNotice tone="danger" className="mb-6" title={`${errors.length} issue${errors.length > 1 ? 's' : ''} to fix`}>
            <ul className="list-disc space-y-1 pl-4">
              {errors.map((issue) => (
                <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          </InlineNotice>
        ) : null}

        {conflicts.length ? (
          <InlineNotice tone="warning" className="mb-6" title="Separator conflict">
            {conflicts.join(', ')} contain “&amp;&amp;”, which the bot uses as a separator inside
            fields, footers, authors and buttons. Those values may not survive a round trip.
          </InlineNotice>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
              {(['editor', 'output'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  aria-pressed={tab === value}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    tab === value ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {value === 'editor' ? 'Editor' : 'Output'}
                </button>
              ))}
            </div>

            {tab === 'editor' ? (
              <div className="mt-6 space-y-6">
                <section className="surface-card p-5">
                  <h2 className="text-sm font-semibold text-ink">Message</h2>
                  <Textarea
                    className="mt-4"
                    label="Content"
                    rows={3}
                    maxLength={2000}
                    value={config.content}
                    placeholder="Text shown above the embed"
                    onChange={(event) => patch({ content: event.target.value })}
                  />
                </section>

                <section className="surface-card p-5">
                  <h2 className="text-sm font-semibold text-ink">Embed</h2>
                  <div className="mt-4 space-y-4">
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
                      <span className="text-sm font-medium text-ink">Colour</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="color"
                          aria-label="Pick embed colour"
                          value={isHexColor(config.color) ? normalizeColor(config.color) : '#77A9F7'}
                          onChange={(event) => patch({ color: event.target.value.toUpperCase() })}
                          className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-surface p-1"
                        />
                        <input
                          type="text"
                          aria-label="Embed colour hex value"
                          value={config.color}
                          onChange={(event) => patch({ color: event.target.value })}
                          className="h-10 w-40 rounded-xl border border-line bg-surface px-3 font-mono text-sm uppercase focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        />
                        {!isHexColor(config.color) ? (
                          <span className="text-xs font-medium text-danger">Use a hex value such as #77A9F7</span>
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
                  </div>
                </section>

                <section className="surface-card p-5">
                  <h2 className="text-sm font-semibold text-ink">Author</h2>
                  <div className="mt-4 space-y-4">
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
                  </div>
                </section>

                <section className="surface-card p-5">
                  <h2 className="text-sm font-semibold text-ink">Footer</h2>
                  <div className="mt-4 space-y-4">
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
                  </div>
                </section>

                <section className="surface-card p-5">
                  <h2 className="text-sm font-semibold text-ink">Fields</h2>
                  <p className="mt-1 text-xs text-ink-muted">
                    Discord supports up to 25 fields, three per row when inline.
                  </p>
                  <div className="mt-4">
                    <FieldEditor
                      fields={config.fields}
                      onChange={(fields) => patch({ fields })}
                    />
                  </div>
                </section>

                <section className="surface-card p-5">
                  <h2 className="text-sm font-semibold text-ink">Buttons</h2>
                  <p className="mt-1 text-xs text-ink-muted">
                    Up to five link buttons per message. The bot creates link buttons only.
                  </p>
                  <div className="mt-4">
                    <ButtonEditor buttons={config.buttons} onChange={(buttons) => patch({ buttons })} />
                  </div>
                </section>

                <section className="surface-card p-5">
                  <h2 className="text-sm font-semibold text-ink">Placeholders</h2>
                  <p className="mt-1 text-xs text-ink-muted">
                    The bot resolves these when the script is sent. Click one to insert it into the
                    description.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {PLACEHOLDERS.map((placeholder) => (
                      <button
                        key={placeholder.token}
                        type="button"
                        onClick={() =>
                          patch({ description: `${config.description}${placeholder.token}` })
                        }
                        title={`Insert ${placeholder.token}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas/60 px-3 py-2 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/60"
                      >
                        <code className="font-mono text-[12px] text-brand-700">{placeholder.token}</code>
                        <span className="truncate text-[11px] text-ink-muted">{placeholder.description}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <section className="surface-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-ink">Embed script</h2>
                      <p className="mt-1 text-xs text-ink-muted">
                        The exact format the bot parses — paste it into any embed command.
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={copyScript} disabled={errors.length > 0}>
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      Copy
                    </Button>
                  </div>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-line bg-canvas px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">
                    {script}
                  </pre>
                </section>

                <section className="surface-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-ink">JSON payload</h2>
                      <p className="mt-1 text-xs text-ink-muted">
                        A Discord-compatible embed payload for other tools.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copyJson}>
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={downloadJson}>
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        Export
                      </Button>
                    </div>
                  </div>
                  <pre className="mt-4 max-h-96 overflow-auto rounded-xl border border-line bg-canvas px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">
                    {json}
                  </pre>
                </section>

                <InlineNotice title="About sending">
                  The bot API does not expose a send endpoint, so this builder never claims to
                  deliver a message to Discord. Copy the script into the bot's embed command, or
                  export the JSON for a tool that can post it.
                </InlineNotice>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <EmbedPreview config={config} sample={sample} onToggleSample={setSample} />

              <div className="mt-6 space-y-3">
                <InlineNotice title="Draft saved locally">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Your draft is stored in this browser only.
                  </span>
                </InlineNotice>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyScript} disabled={errors.length > 0}>
                    <Braces className="h-3.5 w-3.5" aria-hidden />
                    Copy script
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyJson}>
                    <FileJson className="h-3.5 w-3.5" aria-hidden />
                    Copy JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDraft}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    Clear draft
                  </Button>
                </div>

                <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
                  Placeholders are shown literally unless you switch on sample values. Only the bot,
                  running inside Discord, can resolve them for real.
                </p>

                <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
                  The builder started from an example embed. Use Reset to start from an empty embed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import an embed script"
        description="Paste a script in the bot's format. Parts the builder does not understand are reported."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyImport}>Import</Button>
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
        description="This replaces the current draft. The draft stored in this browser is cleared too."
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => reset(true)}>
              Load example
            </Button>
            <Button variant="danger" onClick={() => reset(false)}>
              Start empty
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Choose the example embed to start from a filled-in template, or start from an empty embed.
        </p>
      </Modal>
    </>
  )
}
