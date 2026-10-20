import { botCommandsSchema } from './_lib/bot.js'
import { botProxyHandler, noneToNull, normalizePermissions } from './_lib/proxy.js'
import { withRateLimit } from './_lib/rateLimit.js'

export default withRateLimit(
  'commands',
  120,
  60_000,
  botProxyHandler('/commands', botCommandsSchema, (payload) => {
    const categories = Object.entries(payload)
      .map(([category, commands]) => ({
        name: noneToNull(category) ?? 'Uncategorized',
        commands: commands.map((command) => ({
          name: command.name,
          description: noneToNull(command.description),
          category: noneToNull(command.category) ?? 'Uncategorized',
          args: noneToNull(command.args),
          syntax: noneToNull(command.syntax),
          permissions: normalizePermissions(command.permissions),
          aliases: (command.aliases ?? []).filter((alias) => alias.length > 0),
          cooldown: noneToNull(command.cooldown),
          example: noneToNull(command.example),
          flags: (command.flags ?? []).filter((flag) => flag.length > 0),
        })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const commandCount = categories.reduce((total, category) => total + category.commands.length, 0)

    return { categories, commandCount }
  }),
)
