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
  const [brokenImage, setBrokenImage] = useState<string | null>(null)
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
          Live preview
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={sample}
            onChange={(event) => onToggleSample(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-line text-brand-500 focus:ring-brand-300"
          />
          Show sample placeholder values
        </label>
      </div>

      {sample ? (
        <p className="rounded-lg border border-brand-100 bg-brand-50/70 px-3 py-2 text-xs text-brand-800">
          Sample values only. The builder runs in your browser, so real{' '}
          <code className="font-mono">{'{user}'}</code> and <code className="font-mono">{'{guild.count}'}</code>{' '}
          placeholders are resolved by the bot when the script is sent.
        </p>
      ) : null}

      <div className="rounded-2xl border border-line bg-[#EEF2F7] p-4 sm:p-6">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-white">
            <Bot className="h-5 w-5" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">Bore</span>
              <span className="rounded bg-brand-500 px-1 py-0.5 text-[10px] font-semibold uppercase text-white">
                BOT
              </span>
              <span className="text-xs text-ink-muted">Today at 12:00</span>
            </div>

            <div className="mt-1.5 inline-block max-w-full rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
              {config.content ? (
                <div className="text-[15px] leading-relaxed text-ink">
                  <Markdown>{text(config.content)}</Markdown>
                </div>
              ) : (
                <p className="text-[15px] italic text-ink-muted">No message content</p>
              )}
            </div>

            {hasEmbed ? (
              <div
                className="mt-2 max-w-xl border-l-4 pl-4"
                style={{ borderColor: color }}
              >
                {config.authorName || config.authorIcon || config.authorUrl ? (
                  <div className="flex items-center gap-2">
                    {config.authorIcon ? (
                      <img
                        src={config.authorIcon}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover"
                        onError={() => setBrokenImage(config.authorIcon)}
                        hidden={brokenImage === config.authorIcon}
                      />
                    ) : null}
                    <span className="text-sm font-semibold text-[#2E63C4]">
                      {text(config.authorName) || 'Author'}
                    </span>
                  </div>
                ) : null}

                {config.title ? (
                  <p className="mt-1 text-[16px] font-semibold leading-snug text-[#2E63C4]">
                    {text(config.title)}
                  </p>
                ) : null}

                {config.description ? (
                  <div className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                    <Markdown>{text(config.description)}</Markdown>
                  </div>
                ) : null}

                {config.fields.length ? (
                  <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    {config.fields.map((field) => (
                      <div
                        key={field.id}
                        className={clsx(field.inline && 'sm:col-span-1', !field.inline && 'sm:col-span-2')}
                      >
                        <p className="text-[14px] font-semibold text-ink">{text(field.name)}</p>
                        <div className="text-[14px] leading-relaxed text-ink-soft">
                          <Markdown>{text(field.value)}</Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {config.image ? (
                  <img
                    src={config.image}
                    alt="Embed image"
                    className="mt-3 max-h-64 w-full rounded-lg object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                ) : null}

                {config.thumbnail ? (
                  <div className="mt-3 flex justify-end">
                    <img
                      src={config.thumbnail}
                      alt="Embed thumbnail"
                      className="h-20 w-20 rounded-lg object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : null}

                {config.footerText || config.footerIcon ? (
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-muted">
                    {config.footerIcon ? (
                      <img
                        src={config.footerIcon}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : null}
                    <span>
                      {text(config.footerText)}
                      <span className="px-1">•</span>
                      Today at 12:00
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {config.buttons.length ? (
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {config.buttons.map((button) => (
                    <span
                      key={button.id}
                      // Discord renders link buttons in its default grey style,
                      // which is what the bot creates for every button.
                      className={clsx(
                        'inline-flex h-8 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-white',
                        'bg-[#4E5058]',
                        button.disabled && 'cursor-not-allowed opacity-50',
                      )}
                      title={button.url || 'Button without a link'}
                    >
                      {button.emoji ? <span aria-hidden>{button.emoji}</span> : null}
                      {button.label || 'Button'}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-ink-muted">
                  Discord renders link buttons in its default grey style. The style is still written
                  to the script so other tools can use it.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
