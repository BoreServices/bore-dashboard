import { useState } from 'react'
import clsx from 'clsx'
import { Bot } from 'lucide-react'
import type { EmbedConfig } from '../../lib/embed'
import { applySampleValues } from '../../lib/embed'
import { Markdown } from './Markdown'

export function EmbedPreview({
  config,
  sample,
  onToggleSample,
}: {
  config: EmbedConfig
  sample: boolean
  onToggleSample: (value: boolean) => void
}) {
  const [brokenImages, setBrokenImages] = useState<string[]>([])
  const color = config.color && /^#[0-9a-fA-F]{6}$/.test(config.color) ? config.color : '#2F3136'

  const text = (value: string) => (sample ? applySampleValues(value) : value)

  const hasEmbed = Boolean(
    config.title ||
      config.description ||
      config.image ||
      config.thumbnail ||
      config.authorName ||
      config.authorIcon ||
      config.footerText ||
      config.footerIcon ||
      config.fields.length,
  )

  const hideBroken = (src: string) => setBrokenImages((current) => [...current, src])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">preview</h2>
        <label className="flex cursor-pointer items-center gap-1.5 text-2xs text-ink-muted">
          <input
            type="checkbox"
            checked={sample}
            onChange={(event) => onToggleSample(event.target.checked)}
            className="h-3 w-3 rounded-sm border-line text-brand-500 focus:ring-brand-300"
          />
          sample placeholder values
        </label>
      </div>

      {sample ? (
        <p className="mb-2 rounded border border-brand-100 bg-brand-50/60 px-2.5 py-1.5 text-2xs leading-relaxed text-brand-900">
          Sample values only — the builder runs in your browser, so{' '}
          <code className="font-mono">{'{user}'}</code> and{' '}
          <code className="font-mono">{'{guild.count}'}</code> are resolved by the bot when the
          script is sent.
        </p>
      ) : null}

      <div className="rounded border border-line bg-[#EFF3F8] p-4">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gradient-to-br from-brand-300 to-brand-600 text-white">
            <Bot className="h-4 w-4" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-ink">Bore</span>
              <span className="rounded-sm bg-brand-500 px-1 py-px text-[9px] font-semibold uppercase text-white">
                Bot
              </span>
              <span className="text-2xs text-ink-muted">today at 12:00</span>
            </div>

            <div className="mt-1 inline-block max-w-full rounded-lg rounded-tl-sm bg-surface px-3 py-2 shadow-card">
              {config.content ? (
                <div className="text-base leading-relaxed text-ink">
                  <Markdown>{text(config.content)}</Markdown>
                </div>
              ) : (
                <p className="text-base italic text-ink-muted">No message content</p>
              )}
            </div>

            {hasEmbed ? (
              <div className="mt-2 max-w-xl border-l-4 pl-3" style={{ borderColor: color }}>
                {config.authorName || config.authorIcon ? (
                  <div className="flex items-center gap-2">
                    {config.authorIcon && !brokenImages.includes(config.authorIcon) ? (
                      <img
                        src={config.authorIcon}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                        onError={() => hideBroken(config.authorIcon)}
                      />
                    ) : null}
                    <span className="text-base font-semibold text-[#2E63C4]">
                      {text(config.authorName) || 'Author'}
                    </span>
                  </div>
                ) : null}

                {config.title ? (
                  <p className="mt-1 text-lg font-semibold leading-snug text-[#2E63C4]">
                    {text(config.title)}
                  </p>
                ) : null}

                {config.description ? (
                  <div className="mt-1 text-base leading-relaxed text-ink-soft">
                    <Markdown>{text(config.description)}</Markdown>
                  </div>
                ) : null}

                {config.fields.length ? (
                  <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    {config.fields.map((field) => (
                      <div
                        key={field.id}
                        className={clsx(field.inline ? 'sm:col-span-1' : 'sm:col-span-2')}
                      >
                        <p className="text-base font-semibold text-ink">{text(field.name)}</p>
                        <div className="text-base leading-relaxed text-ink-soft">
                          <Markdown>{text(field.value)}</Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {config.image && !brokenImages.includes(config.image) ? (
                  <img
                    src={config.image}
                    alt="Embed image"
                    className="mt-3 max-h-56 w-full rounded object-cover"
                    onError={() => hideBroken(config.image)}
                  />
                ) : null}

                {config.thumbnail && !brokenImages.includes(config.thumbnail) ? (
                  <div className="mt-3 flex justify-end">
                    <img
                      src={config.thumbnail}
                      alt="Embed thumbnail"
                      className="h-16 w-16 rounded object-cover"
                      onError={() => hideBroken(config.thumbnail)}
                    />
                  </div>
                ) : null}

                {config.footerText || config.footerIcon ? (
                  <div className="mt-3 flex items-center gap-2 text-2xs text-ink-muted">
                    {config.footerIcon && !brokenImages.includes(config.footerIcon) ? (
                      <img
                        src={config.footerIcon}
                        alt=""
                        className="h-4 w-4 rounded-full object-cover"
                        onError={() => hideBroken(config.footerIcon)}
                      />
                    ) : null}
                    <span>
                      {text(config.footerText)}
                      <span className="px-1">•</span>
                      today at 12:00
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {config.buttons.length ? (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {config.buttons.map((button) => (
                    <span
                      key={button.id}
                      // Discord renders link buttons in its default grey style,
                      // which is what the bot creates for every button.
                      className={clsx(
                        'inline-flex h-7 items-center gap-1.5 rounded bg-[#4E5058] px-3 text-sm font-medium text-white',
                        button.disabled && 'opacity-50',
                      )}
                      title={button.url || 'Button without a link'}
                    >
                      {button.emoji ? <span aria-hidden>{button.emoji}</span> : null}
                      {button.label || 'Button'}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-ink-muted">
                  Link buttons render in Discord's default grey style. The style is still written to
                  the script so other tools can use it.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
