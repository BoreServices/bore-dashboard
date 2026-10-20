import { describe, expect, it } from 'vitest'
import {
  applySampleValues,
  emptyEmbed,
  getParts,
  isHexColor,
  normalizeColor,
  parseEmbed,
  sampleEmbed,
  serializeEmbed,
  serializeConflicts,
  toDiscordJson,
  validateEmbed,
  type EmbedConfig,
} from '../src/lib/embed'

describe('embed script format', () => {
  it('splits parts the same way the bot parser does', () => {
    // The bot removes the `{embed}` marker first, then strips one character
    // from each side of every `$v` separated part.
    expect(getParts('{embed}$v{title:Hello}')).toEqual(['', 'title:Hello'])
    expect(getParts('{title:Hello}$v{description:World}')).toEqual(['title:Hello', 'description:World'])
  })

  it('serializes to the bot script format', () => {
    const config: EmbedConfig = {
      ...emptyEmbed(),
      title: 'Welcome',
      description: 'Hello there',
      color: '#77A9F7',
    }

    expect(serializeEmbed(config)).toBe(
      '{embed}$v{title:Welcome}$v{description:Hello there}$v{color:77A9F7}',
    )
  })

  it('writes fields, footer, images and buttons in the bot format', () => {
    const config: EmbedConfig = {
      ...emptyEmbed(),
      title: 'Stats',
      fields: [{ id: '1', name: 'Members', value: '10', inline: false }],
      footerText: 'Bore',
      footerIcon: 'https://example.com/icon.png',
      image: 'https://example.com/image.png',
      thumbnail: 'https://example.com/thumb.png',
      buttons: [
        {
          id: '1',
          label: 'Open',
          url: 'https://example.com',
          emoji: '🔗',
          style: 'primary',
          disabled: false,
        },
      ],
    }

    const script = serializeEmbed(config)

    expect(script).toContain('{field:Members && 10 && false}')
    expect(script).toContain('{footer:Bore && https://example.com/icon.png}')
    expect(script).toContain('{image:https://example.com/image.png}')
    expect(script).toContain('{thumbnail:https://example.com/thumb.png}')
    // No space after `label:` — the bot does not trim button labels.
    expect(script).toContain('{button: && label:Open && emoji: 🔗 && url: https://example.com && style: blue}')
  })

  it('round-trips a configuration', () => {
    const config = sampleEmbed()
    const parsed = parseEmbed(serializeEmbed(config))

    expect(parsed.config.title).toBe(config.title)
    expect(parsed.config.description).toBe(config.description)
    expect(parsed.config.color).toBe(config.color)
    expect(parsed.config.fields).toHaveLength(config.fields.length)
    expect(parsed.config.fields[0].name).toBe('Member')
    expect(parsed.config.fields[0].inline).toBe(true)
    expect(parsed.config.buttons).toHaveLength(1)
    expect(parsed.config.buttons[0].label).toBe('Open the builder')
    expect(parsed.config.buttons[0].style).toBe('primary')
    expect(parsed.config.buttons[0].disabled).toBe(false)
  })

  it('reads the button format produced by the bot embedcode command', () => {
    const { config } = parseEmbed(
      '{embed}$v{button: label: Legacy && emoji: 🎉 && url: https://example.com && style: primary}',
    )

    expect(config.buttons).toHaveLength(1)
    expect(config.buttons[0].label).toBe('Legacy')
    expect(config.buttons[0].emoji).toBe('🎉')
    expect(config.buttons[0].url).toBe('https://example.com')
    // The bot only understands red/green/gray/blue, so anything else is grey.
    expect(config.buttons[0].style).toBe('secondary')
  })

  it('produces a script the bot parser reads back identically', () => {
    const config: EmbedConfig = {
      ...emptyEmbed(),
      content: 'Hello',
      title: 'Title',
      description: 'Description',
      color: '#77A9F7',
      authorName: 'Bore',
      authorIcon: 'https://example.com/author.png',
      authorUrl: 'https://example.com',
      footerText: 'Footer',
      footerIcon: 'https://example.com/footer.png',
      image: 'https://example.com/image.png',
      thumbnail: 'https://example.com/thumb.png',
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
    const parsed = parseEmbed(script)

    // A faithful port of the bot's Python parser, used as the oracle.
    const botParts = script
      .replace('{embed}', '')
      .split('$v')
      .map((part) => part.slice(1, -1))
    const botField = botParts.find((part) => part.startsWith('field:'))?.slice('field:'.length)
    const botButton = botParts.find((part) => part.startsWith('button:'))?.slice('button:'.length)
    const botColor = botParts.find((part) => part.startsWith('color:'))?.slice('color:'.length)

    // marker + content + title + description + color + author + 2 fields +
    // footer + image + thumbnail + 2 buttons
    expect(botParts).toHaveLength(13)
    expect(botField).toBe('First && One && true')
    expect(botButton).toBe(' && label:Open && emoji: 🔗 && url: https://example.com && style: blue')
    expect(Number.parseInt(String(botColor), 16)).toBe(0x77a9f7)

    // The bot's parser strips `label:` without trimming, so the label it reads
    // is exactly the label that was written.
    expect(botButton?.split(' && ')[1]?.replace('label:', '')).toBe('Open')
    expect(parsed.config.buttons[0].label).toBe('Open')
    expect(parsed.config.buttons[1].disabled).toBe(true)
    expect(parsed.config.fields[1].inline).toBe(false)
  })

  it('falls back to the bot default colour for an invalid hex value', () => {
    const { config, warnings } = parseEmbed('{embed}$v{color:not-a-colour}')
    expect(config.color).toBe('#2F3136')
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('parses a bot style name into a builder style', () => {
    const { config } = parseEmbed('{embed}$v{button: && label: A && url: https://e.com && style: green}')
    expect(config.buttons[0].style).toBe('success')
  })

  it('reports unsupported parts instead of dropping them silently', () => {
    const { warnings } = parseEmbed('{embed}$v{nonsense:value}')
    expect(warnings.some((warning) => warning.includes('nonsense'))).toBe(true)
  })
})

describe('embed validation', () => {
  it('accepts a valid configuration', () => {
    expect(validateEmbed(sampleEmbed()).filter((issue) => issue.severity === 'error')).toHaveLength(0)
  })

  it('rejects a button without a URL', () => {
    const config: EmbedConfig = {
      ...emptyEmbed(),
      buttons: [{ id: '1', label: 'Broken', url: '', emoji: '', style: 'primary', disabled: false }],
    }
    const issues = validateEmbed(config)
    expect(issues.some((issue) => issue.field === 'buttons.0.url')).toBe(true)
  })

  it('rejects a non http url', () => {
    const config: EmbedConfig = { ...emptyEmbed(), image: 'javascript:alert(1)' }
    const issues = validateEmbed(config)
    expect(issues.some((issue) => issue.field === 'image')).toBe(true)
  })

  it('flags values containing the $v separator', () => {
    const config: EmbedConfig = { ...emptyEmbed(), description: 'a $v b' }
    expect(validateEmbed(config).some((issue) => issue.field === 'description')).toBe(true)
  })

  it('flags values containing the && separator', () => {
    const config: EmbedConfig = { ...emptyEmbed(), fields: [{ id: '1', name: 'a && b', value: 'v', inline: true }] }
    expect(serializeConflicts(config)).toContain('field 1 name')
  })

  it('validates hex colours', () => {
    expect(isHexColor('#77A9F7')).toBe(true)
    expect(isHexColor('77a9f7')).toBe(true)
    expect(isHexColor('#fff')).toBe(true)
    expect(isHexColor('blue')).toBe(false)
    expect(normalizeColor('#fff')).toBe('#FFFFFF')
  })
})

describe('discord json export', () => {
  it('produces a discord compatible payload', () => {
    const config: EmbedConfig = {
      ...emptyEmbed(),
      content: 'hi',
      title: 'Title',
      color: '#77A9F7',
      fields: [{ id: '1', name: 'Name', value: 'Value', inline: true }],
      buttons: [
        { id: '1', label: 'Go', url: 'https://example.com', emoji: '', style: 'danger', disabled: false },
      ],
    }

    const json = toDiscordJson(config)
    expect(json.content).toBe('hi')
    expect(json.embeds[0].color).toBe(0x77a9f7)
    expect(json.embeds[0].fields[0]).toEqual({ name: 'Name', value: 'Value', inline: true })
    expect(json.components[0].components[0].style).toBe(4)
    expect(json.components[0].components[0].url).toBe('https://example.com')
  })
})

describe('sample values', () => {
  it('replaces known placeholders only', () => {
    expect(applySampleValues('hi {user.name} and {unknown.token}')).toBe('hi bore and {unknown.token}')
  })
})
