import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { NAV_LINKS, SITE } from '../../lib/site'

const columns = [
  {
    title: 'Product',
    links: NAV_LINKS.map((link) => ({ label: link.label, to: link.to })),
  },
  {
    title: 'Resources',
    links: [
      { label: 'Add to Discord', to: SITE.inviteUrl, external: true },
      { label: 'Support server', to: SITE.supportUrl, external: true },
      { label: 'Command reference', to: '/commands' },
      { label: 'Embed builder', to: '/embed' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-ink-muted">
            {SITE.description}
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
              {column.title}
            </h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  {'external' in link && link.external ? (
                    <a
                      href={link.to}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-base text-ink-soft transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-base text-ink-soft transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-1.5 px-4 py-4 text-2xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {SITE.company}
          </p>
          <p>Bore is not affiliated with Discord Inc.</p>
        </div>
      </div>
    </footer>
  )
}
