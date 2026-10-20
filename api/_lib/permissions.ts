/**
 * Discord permission bits, using the discord.py 2.7.1 values the bot itself
 * checks against. The bitfield arrives from Discord as a decimal string.
 */
export const PERMISSION_BITS = {
  administrator: 8,
  manage_channels: 16,
  manage_guild: 32,
  manage_messages: 8192,
  manage_roles: 268435456,
} as const

export type PermissionName = keyof typeof PERMISSION_BITS

/**
 * `ADMINISTRATOR` implies every other permission, so it always passes.
 */
export function hasPermission(
  bits: string | number | null | undefined,
  required: PermissionName,
): boolean {
  let value: bigint
  try {
    value = BigInt(bits ?? '0')
  } catch {
    return false
  }
  if (value === 0n) return false
  if ((value & BigInt(PERMISSION_BITS.administrator)) !== 0n) return true
  const needed = BigInt(PERMISSION_BITS[required])
  return (value & needed) === needed
}
