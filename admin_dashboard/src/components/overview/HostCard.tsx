import { gigabytes, type Host, type Usage } from '../../lib/server'
import Card from '../logs/Card'

const RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// The same limits the backend raises alerts at (AdminServerService) go critical here.
function ringColor(percent: number): string {
  if (percent >= 85) return 'var(--color-critical)'
  if (percent >= 70) return 'var(--color-soil)'
  return 'var(--color-leaf)'
}

function Gauge({ label, percent, detail }: { label: string; percent: number; detail: string }) {
  const rounded = Math.round(percent)
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-[20px] bg-sand px-3 py-5">
      <div className="relative size-[110px]">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={`${label} ${rounded}%`}>
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--color-cream)" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={ringColor(percent)}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(CIRCUMFERENCE * Math.min(percent, 100)) / 100} ${CIRCUMFERENCE}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-primary text-4xl font-semibold text-green">
          {rounded}%
        </span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-semibold tracking-wider text-soil uppercase">{label}</span>
        <span className="text-[13px] text-ink">{detail}</span>
      </div>
    </div>
  )
}

function ofTotal(usage: Usage): string {
  return `${gigabytes(usage.usedBytes)} of ${gigabytes(usage.totalBytes)} GB`
}

function HostCard({ host, className = '' }: { host: Host | null; className?: string }) {
  return (
    <Card
      title="Host"
      subtitle={host ? `Up ${host.uptime} · load ${host.load1.toFixed(2)} / ${host.load5.toFixed(2)} / ${host.load15.toFixed(2)}` : undefined}
      className={className}
    >
      {host ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Gauge label="CPU" percent={host.cpuPercent} detail={`${host.cpuCores} cores`} />
          <Gauge label="Memory" percent={host.memory.percent} detail={ofTotal(host.memory)} />
          <Gauge label="Disk" percent={host.disk.percent} detail={ofTotal(host.disk)} />
          <Gauge label="Swap" percent={host.swap.percent} detail={ofTotal(host.swap)} />
        </div>
      ) : (
        <p className="text-sm text-ink">
          No host numbers: Glances isn't set up (GLANCES_URL) or isn't answering.
        </p>
      )}
    </Card>
  )
}

export default HostCard
