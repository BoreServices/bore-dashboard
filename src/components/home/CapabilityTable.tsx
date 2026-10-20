const modules = [
  {
    name: 'Moderation',
    summary: 'Bans, kicks, timeouts, forced nicknames and bulk purges scoped by message type.',
    commands: ['ban', 'kick', 'mute', 'unban', 'purge', 'lockdown'],
  },
  {
    name: 'Anti-nuke',
    summary: 'Per-module thresholds and punishments for destructive actions in a raid.',
    commands: ['antinuke', 'antiraid'],
  },
  {
    name: 'Server',
    summary: 'Welcome, leave and boost messages, sticky messages and auto-responders.',
    commands: ['welcome', 'leaves', 'boosts', 'stickymessage', 'autoresponder'],
  },
  {
    name: 'Roles & channels',
    summary: 'Create, delete, colour and hoist roles. Create, rename and tag channels.',
    commands: ['role', 'channel', 'autorole', 'fakeperms'],
  },
  {
    name: 'Honeypots',
    summary: 'Decoy channels that jail, soft-ban or ban whoever posts in them.',
    commands: ['honeypot'],
  },
  {
    name: 'Music',
    summary: 'Play, pause, skip, shuffle, loop and volume control through Lavalink.',
    commands: ['play', 'skip', 'shuffle', 'loop', 'volume'],
  },
  {
    name: 'Information',
    summary: 'Lookups for users, servers, invites, bans and the bot itself.',
    commands: ['avatar', 'bans', 'invite', 'uptime', 'status'],
  },
  {
    name: 'Utilities',
    summary: 'AFK, quick polls, message recovery, macros and temporary voice channels.',
    commands: ['afk', 'quickpoll', 'snipe', 'voicemaster'],
  },
]

export function CapabilityTable() {
  return (
    <div className="overflow-x-auto rounded border border-line bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-40 border-b border-line px-3 py-2 text-left font-mono text-2xs font-medium uppercase tracking-[0.1em] text-ink-muted">
              Module
            </th>
            <th className="border-b border-line px-3 py-2 text-left font-mono text-2xs font-medium uppercase tracking-[0.1em] text-ink-muted">
              What it does
            </th>
            <th className="w-64 border-b border-line px-3 py-2 text-left font-mono text-2xs font-medium uppercase tracking-[0.1em] text-ink-muted">
              Commands
            </th>
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.name} className="align-top last:[&>td]:border-b-0">
              <td className="border-b border-line px-3 py-2.5 text-base font-medium text-ink">
                {module.name}
              </td>
              <td className="border-b border-line px-3 py-2.5 text-base leading-relaxed text-ink-soft">
                {module.summary}
              </td>
              <td className="border-b border-line px-3 py-2.5">
                <span className="flex flex-wrap gap-1">
                  {module.commands.map((command) => (
                    <code
                      key={command}
                      className="rounded-sm border border-line bg-inset px-1.5 py-px font-mono text-2xs text-ink-soft"
                    >
                      {command}
                    </code>
                  ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
