// Emits the script + JSON the browser builder produces, for bot-side verification.
import { writeFileSync } from 'node:fs'
import { serializeEmbed, toDiscordJson, sampleEmbed, parseEmbed } from '../src/lib/embed.ts'

const config = {
  ...sampleEmbed(),
  content: 'Hello {user.mention}',
  authorName: 'Bore',
  authorIcon: 'https://example.com/author.png',
  authorUrl: 'https://example.com',
  footerIcon: 'https://example.com/footer.png',
  fields: [
    { id: '1', name: 'First', value: 'One', inline: true },
    { id: '2', name: 'Second', value: 'Two', inline: false },
  ],
  buttons: [
    { id: '1', label: 'Open', url: 'https://example.com', emoji: '🔗', style: 'primary', disabled: false },
    { id: '2', label: 'Later', url: 'https://example.org', emoji: '', style: 'danger', disabled: true },
  ],
}

const script = serializeEmbed(config)
writeFileSync('embed-script.txt', script)
writeFileSync('embed-json.txt', JSON.stringify(toDiscordJson(config), null, 2))
console.log(script)
console.log('--- re-parsed labels:', parseEmbed(script).config.buttons.map((b) => b.label).join(' | '))
