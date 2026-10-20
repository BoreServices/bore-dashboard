import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  Braces,
  Command as CommandIcon,
  Gauge,
  ListChecks,
  Music4,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Container, PageHeader } from '../components/layout/Container'
import { ButtonLink } from '../components/ui/Button'
import { DashboardMockup } from '../components/home/DashboardMockup'
import { LiveStats } from '../components/home/LiveStats'
import { SITE } from '../lib/site'
import { usePageMeta } from '../lib/usePageMeta'

const features = [
  {
    icon: ShieldCheck,
    title: 'Moderation that actually lands',
    body: 'Ban, kick, mute with Discord timeouts, warn and purge by humans, bots, links, mentions, attachments or stickers — plus role and channel management.',
  },
  {
    icon: Gauge,
    title: 'Anti-raid and anti-nuke',
    body: 'Configurable thresholds and punishments for raid waves and nukes, with per-guild whitelists and staff exemptions.',
  },
  {
    icon: Radio,
    title: 'Server automation',
    body: 'Welcome, boost and leave messages, sticky messages, auto-responders, auto-roles, custom prefixes and command aliases.',
  },
  {
    icon: Sparkles,
    title: 'Roles and channels on demand',
    body: 'Create, delete, colour, hoist and toggle mentionable roles. Create, rename, delete and mark channels NSFW in a few keystrokes.',
  },
  {
    icon: Users,
    title: 'Community utilities',
    body: 'Auto-mod roles, AFK, quick polls, snipe deleted messages, Last.fm now playing and temporary VoiceMaster channels.',
  },
  {
    icon: Music4,
    title: 'Music and media',
    body: 'Play, queue, skip, shuffle, loop and adjust volume through Lavalink, plus shazam, tenor and screenshot helpers.',
  },
  {
    icon: ListChecks,
    title: 'Live command directory',
    body: 'Every command the bot exposes is published here straight from the running bot, with syntax, permissions, cooldowns and examples.',
  },
  {
    icon: Braces,
    title: 'Embed builder',
    body: 'Compose Discord embeds with a live preview, placeholder reference and export to the exact script format the bot understands.',
  },
]

const tools = [
  {
    to: '/commands',
    icon: CommandIcon,
    title: 'Command directory',
    body: 'Search every command by name, category, permission or cooldown. New bot commands appear here automatically.',
    cta: 'Browse commands',
  },
  {
    to: '/embed',
    icon: Braces,
    title: 'Embed builder',
    body: 'Design an embed visually, preview it as Discord renders it, then copy the bot-ready script or a JSON payload.',
    cta: 'Open the builder',
  },
]

export function HomePage() {
  usePageMeta(
    'Bore — Moderation, utility and automation for Discord',
    SITE.description,
    '/',
  )

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-50/70 via-canvas to-canvas">
        <div className="panel-grid absolute inset-0 opacity-60" aria-hidden />
        <div
          className="absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden
        />
        <Container className="relative grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-medium text-brand-700">
              <Bot className="h-3.5 w-3.5" aria-hidden />
              Bore · moderation, utility and automation
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              Everything a Discord server needs,
              <span className="text-brand-500"> in one bot.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Bore handles moderation, raid protection, role and channel management, welcome and
              boost messages, auto-responders, music and the small utilities that keep a community
              running — with a live command directory and a real status page.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={SITE.inviteUrl} external size="lg">
                Add to Discord
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink to="/commands" variant="outline" size="lg">
                Explore commands
              </ButtonLink>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              {['Live command directory', 'Real shard status', 'Embed builder'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-in lg:pl-4">
            <DashboardMockup />
          </div>
        </Container>
      </section>

      <LiveStats />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <PageHeader
          eyebrow="What Bore does"
          title="Built for the day-to-day work of a community server"
          description="Every capability below comes from commands the bot actually ships — not a wish list."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group surface-card p-6 transition-shadow duration-200 hover:shadow-lift"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                <feature.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <PageHeader
            eyebrow="Tools"
            title="Do more with Bore"
            description="Two browser tools that work with the bot directly — no installation required."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {tools.map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="group relative overflow-hidden rounded-2xl border border-line bg-canvas/60 p-8 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/40 hover:shadow-lift"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-brand-600 shadow-card">
                  <tool.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-ink">{tool.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{tool.body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  {tool.cta}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-500 to-brand-700 px-8 py-14 text-center shadow-panel sm:px-16">
          <div
            className="absolute inset-0 opacity-25 panel-grid"
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Bring Bore into your server
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-50/90">
              Moderation, automation and utilities are one invite away. The command directory and
              embed builder are free to use before you even add the bot.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink
                href={SITE.inviteUrl}
                external
                size="lg"
                className="bg-white text-brand-700 hover:bg-brand-50"
              >
                Add to Discord
              </ButtonLink>
              <ButtonLink
                to="/status"
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Check bot status
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
