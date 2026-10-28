import Image from 'next/image'
import Link from 'next/link'
import { INVITE_URL, SUPPORT_URL } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <Image src="/img/bore.webp" alt="bore" width={32} height={32} className="footer-avatar" />
            <span>bore</span>
          </div>
          <p className="footer-tagline">The only Discord bot you&apos;ll ever need.</p>
          <div className="footer-actions">
            <a href={INVITE_URL} target="_blank" rel="noopener noreferrer" className="footer-link">Add to Server</a>
            <span className="footer-sep">&middot;</span>
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="footer-link">Support</a>
            <span className="footer-sep">&middot;</span>
            <a href="https://docs.bore.bot" target="_blank" rel="noopener noreferrer" className="footer-link">Docs</a>
            <span className="footer-sep">&middot;</span>
            <Link href="/terms" className="footer-link">Terms</Link>
            <span className="footer-sep">&middot;</span>
            <Link href="/privacy" className="footer-link">Privacy</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} bore &mdash; Not affiliated with Discord Inc.</p>
          <p>Owned and operated by <a href="https://BoreServices.net" target="_blank" rel="noopener noreferrer" className="footer-link">BoreServices, LLC</a> (1480587)</p>
        </div>
      </div>
    </footer>
  )
}
