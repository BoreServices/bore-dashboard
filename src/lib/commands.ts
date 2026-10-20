import type { Command, CommandCategory } from '../types/api'

export function matchesSearch(command: Command, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  const haystack = [
    command.name,
    command.description ?? '',
    command.category,
    command.args ?? '',
    command.syntax ?? '',
    command.example ?? '',
    command.permissions.join(' '),
    command.aliases.join(' '),
    command.flags.join(' '),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(needle)
}

export type CommandFilter = {
  query: string
  category: string | null
}

/** Filters the directory while preserving the category grouping. */
export function filterCategories(
  categories: CommandCategory[],
  { query, category }: CommandFilter,
): CommandCategory[] {
  return categories
    .map((entry) => ({
      name: entry.name,
      commands: entry.commands.filter(
        (command) =>
          (!category || entry.name === category) && matchesSearch(command, query),
      ),
    }))
    .filter((entry) => entry.commands.length > 0)
}

export function countCommands(categories: CommandCategory[]): number {
  return categories.reduce((total, entry) => total + entry.commands.length, 0)
}

export function categoryCounts(categories: CommandCategory[]): { name: string; count: number }[] {
  return categories.map((entry) => ({ name: entry.name, count: entry.commands.length }))
}
