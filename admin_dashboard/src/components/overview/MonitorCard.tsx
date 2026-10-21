import { timeAgo, type CheckStatus, type Monitor } from '../../lib/server'

// Class names are written out in full so Tailwind finds them.
const STATUS: Record<CheckStatus, { label: string; pill: string; beat: string }> = {
  up: { label: 'Up', pill: 'bg-green text-white', beat: 'bg-green' },
  down: { label: 'Down', pill: 'bg-critical text-white', beat: 'bg-critical' },
  pending: { label: 'Pending', pill: 'bg-warning text-charcoal', beat: 'bg-warning' },
  maintenance: { label: 'Maintenance', pill: 'bg-ink text-white', beat: 'bg-ink' },
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold tracking-wider text-soil uppercase">{label}</span>
      <span className="text-xl font-semibold text-charcoal">{value}</span>
    </div>
  )
}

// now: when the numbers were fetched, for "checked 20 seconds ago".
function MonitorCard({ monitor, now }: { monitor: Monitor; now: number }) {
  const status = STATUS[monitor.status]
  const failed = monitor.beats.filter((beat) => beat.status === 'down').length

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-cream p-6 shadow-card">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-green">{monitor.name}</h2>
        <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold ${status.pill}`}>
          <span className="size-2 rounded-full bg-current" aria-hidden="true" />
          {status.label}
        </span>
      </header>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wider text-soil uppercase">Uptime 24 h</span>
          <span className="font-primary text-[56px] leading-[0.9] font-semibold text-green">
            {monitor.uptime24h === null ? '—' : `${Number(monitor.uptime24h.toFixed(2))}%`}
          </span>
        </div>
        <Stat label="Response" value={monitor.pingMs === null ? '—' : `${monitor.pingMs} ms`} />
        <Stat label="Checked" value={monitor.lastCheck ? timeAgo(monitor.lastCheck, now) : 'Never'} />
      </div>

      {monitor.beats.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div
            role="img"
            aria-label={`Last ${monitor.beats.length} checks: ${failed} failed`}
            className="flex h-7 gap-[3px]"
          >
            {monitor.beats.map((beat) => (
              <span
                key={beat.time}
                title={`${new Date(beat.time).toLocaleTimeString('en-GB')} · ${STATUS[beat.status].label}${beat.pingMs === null ? '' : ` · ${beat.pingMs} ms`}`}
                className={`flex-1 rounded-[3px] ${STATUS[beat.status].beat}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-ink">
            <span>{timeAgo(monitor.beats[0].time, now)}</span>
            <span>Now</span>
          </div>
        </div>
      )}
    </section>
  )
}

export default MonitorCard
