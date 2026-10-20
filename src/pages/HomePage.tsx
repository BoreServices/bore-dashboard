import { Link } from 'react-router-dom'
import { ArrowRight, Braces, Command as CommandIcon, ShieldCheck } from 'lucide-react'
import { Container, PageHeader } from '../components/layout/Container'
import { ButtonLink } from '../components/ui/Button'
import { StatusConsole } from '../components/home/StatusConsole'
import { CapabilityTable } from '../components/home/CapabilityTable'
import { SITE } from '../lib/site'
import { usePageMeta } from '../lib/usePageMeta'

const tools = [
  {
    to: '/commands',
    icon: CommandIcon,
    title: 'Command directory',
    body: 'Every command the running bot exposes, with syntax, permissions, cooldowns and examples. New commands appear here without a deploy.',
    cta: 'Browse commands',
  },
  {
    to: '/embed',
    icon: Braces,
    title: 'Embed builder',
    body: 'Compose an embed with a live preview and export it in the exact script format the bot parses, or as a Discord-compatible payload.',
    cta: 'Open the builder',
  },
]

export function HomePage() {
  usePageMeta(
    'Bore — moderation and automation for Discord',
    SITE.description,
    '/',
  )

  return (
    <>
      <section className="border-b border-line bg-canvas">
        <Container className="grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <span className="flex items-center gap-2.5">
              <span className="h-3 w-0.5 bg-brand-500" aria-hidden />
              <span className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-muted">
                bore · moderation · automation · utilities
              </span>
            </span>

            <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-[2.6rem]">
              Moderate, automate and configure your Discord server.
            </h1>

            <p className="mt-4 max-w-xl text-md leading-relaxed text-ink-soft">
              Bore handles the work a community server accumulates: moderation and raid
              protection, welcome and boost messages, role and channel management, music and the
              small utilities that keep a channel moving.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href={SITE.inviteUrl} external variant="primary" size="md">
                Add to Discord
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </ButtonLink>
              <ButtonLink to="/commands" variant="quiet" size="md">
                Browse the command directory
              </ButtonLink>
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4">
              {[
                { label: 'auth', value: 'Discord OAuth2, no bot management scopes' },
                { label: 'status', value: 'polled straight from the bot API' },
                { label: 'config', value: 'per-server settings you can change' },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-faint">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-xs text-ink-soft">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <StatusConsole />
        </Container>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <PageHeader
          eyebrow="modules"
          title="What the bot actually ships"
          description="Every module below maps to commands the bot exposes. The directory lists them all with their real syntax."
        />
        <div className="mt-6">
          <CapabilityTable />
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <Container className="py-16">
          <PageHeader eyebrow="tools" title="Browser tools" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="group rounded border border-line bg-surface p-5 transition-colors hover:border-brand-300"
              >
                <span className="flex items-center gap-2">
                  <tool.icon className="h-3.5 w-3.5 text-brand-500" aria-hidden />
                  <span className="text-base font-medium text-ink">{tool.title}</span>
                </span>
                <p className="mt-2 text-base leading-relaxed text-ink-soft">{tool.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                  {tool.cta}
                  <ArrowRight
                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start gap-5 rounded border border-brand-200 bg-brand-50/70 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-brand-500" aria-hidden />
              Bring Bore into your server
            </h2>
            <p className="mt-2 max-w-xl text-base text-ink-soft">
              The command directory and the embed builder work without installing anything.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ButtonLink href={SITE.inviteUrl} external variant="primary">
              Add to Discord
            </ButtonLink>
            <ButtonLink to="/status" variant="secondary">
              Check status
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
