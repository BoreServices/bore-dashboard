import type { Metadata, Viewport } from 'next'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ClientEffects from '@/components/ClientEffects'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-outfit',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://bore.bot'),
  title: {
    default: 'bore',
    template: '%s | bore',
  },
  description:
    'The all-in-one solution for seamless server management — powerful, polished, and visually refined.',
  icons: { icon: '/img/bore.webp' },
  openGraph: {
    images: ['/img/bore.webp'],
  },
  twitter: {
    card: 'summary',
    images: ['/img/bore.webp'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1a1a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <Navbar />
        <div className="page">{children}</div>
        <Footer />
        <ClientEffects />
      </body>
    </html>
  )
}
