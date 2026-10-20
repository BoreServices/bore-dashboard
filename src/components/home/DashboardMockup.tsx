import { Activity, LayoutDashboard, MessageSquareCode, ShieldCheck, Users } from 'lucide-react'

/**
 * Decorative preview of the Bore dashboard. It is a static illustration of the
 * product surface — the real dashboard lives at /dashboard.
 */
export function DashboardMockup() {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-panel"
    >
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" />
        <span className="ml-3 truncate rounded-md bg-surface px-2.5 py-1 text-[11px] text-ink-muted">
          bore.best/dashboard
        </span>
      </div>

      <div className="flex">
        <div className="hidden w-44 shrink-0 border-r border-line bg-canvas/60 p-3 sm:block">
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-brand-300 to-brand-600" />
            <span className="text-xs font-semibold text-ink">Bore</span>
          </div>
          <div className="mt-3 space-y-1">
            {[LayoutDashboard, ShieldCheck, Users, Activity].map((Icon, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
                  index === 0 ? 'bg-brand-50 text-brand-700' : 'text-ink-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {['Overview', 'Moderation', 'Members', 'Status'][index]}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-brand-200 bg-brand-50/60 px-2.5 py-2 text-[10px] leading-relaxed text-brand-800">
            Dashboard features are still being built.
          </div>
        </div>

        <div className="flex-1 space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-ink-muted">Overview</p>
              <p className="text-sm font-semibold text-ink">Your server at a glance</p>
            </div>
            <span className="rounded-md border border-line px-2 py-1 text-[10px] font-medium text-ink-muted">
              Preview
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['Servers', 'Members', 'Shards'].map((label) => (
              <div key={label} className="rounded-xl border border-line bg-canvas/50 px-2.5 py-2">
                <p className="text-[10px] text-ink-muted">{label}</p>
                <div className="mt-1.5 h-3 w-12 rounded bg-brand-100" />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-line bg-canvas/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-ink">Shard health</p>
              <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-ink-muted">
                Preview
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
              {['#0', '#1', '#2'].map((shard) => (
                <div key={shard} className="flex items-center gap-2">
                  <span className="w-6 text-[10px] text-ink-muted">{shard}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <span className="block h-full w-1/2 rounded-full bg-brand-200" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-3 py-2">
            <MessageSquareCode className="h-3.5 w-3.5 text-brand-500" />
            <p className="text-[11px] text-ink-muted">
              <span className="font-medium text-ink">,embed</span> — build embeds with live placeholders
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
