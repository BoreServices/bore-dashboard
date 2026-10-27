import type { Metadata } from 'next'
import HomeView from '@/components/HomeView'

export const metadata: Metadata = {
  title: 'bore',
  description:
    'The all-in-one solution for seamless server management — powerful, polished, and visually refined.',
}
const discordComponentEmbed = {
  type: 17,
  accent_color: 16777215,
  components: [
    {
      type: 9,
      accessory: {
        type: 11,
        media: { url: 'https://borebot.vercel.app/img/bore.webp' },
      },
      components: [
        {
          type: 10,
          content:
            "# bore\ndiscord's premier all-in-one application, made for all types of communities, now with **400+** commands",
        },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: 'Website', url: 'https://borebot.vercel.app/' },
        { type: 2, style: 5, label: 'Invite', url: 'https://discord.com/oauth2/authorize?client_id=1559612999554175067' },
        { type: 2, style: 5, label: 'Support', url: 'https://discord.gg/92qFHZ9YmT' },
      ],
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        id="discord:component-embed"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ component: discordComponentEmbed }),
        }}
      />
      <HomeView />
    </>
  )
}
