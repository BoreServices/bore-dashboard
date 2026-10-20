import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { NAV_LINKS, SITE } from '../../lib/site'

const footerColumns = [
  {
    title: 'Product',
    links: NAV_LINKS.map((link) => ({ label: link.label, to: link.to })),
  },
  {
    title: 'Resources',
    links: [
      { label: 'Add to Discord', to: SITE.inviteUrl, external: true },
      { label: 'Support server', to: SITE.supportUrl, external: true },
      { label: 'Command directory', to: '/commands' },
      { label: 'Embed builder', to: '/embed' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            {SITE.description}
          </p>
          <p className="mt-4 text-xs text-ink-muted">
            Operated by {SITE.company}.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  {'external' in link && link.external ? (
                    <a
                      href={link.to}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm text-ink-muted transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-sm text-ink-muted transition-colors hover:text-brand-600"
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
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {SITE.company}. All rights reserved.</p>
          <p>
            Bore is not affiliated with or endorsed by Discord Inc. Discord is a trademark of
            Discord Inc.
          </p>
        </div>
      </div>
    </footer>
  )
}
