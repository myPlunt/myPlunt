import type { Alert } from '../../lib/server'
import Card from '../logs/Card'

const SEVERITY = {
  critical: { label: 'Critical', badge: 'bg-critical text-white' },
  warning: { label: 'Warning', badge: 'bg-warning text-charcoal' },
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function AlertsCard({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <p role="status" className="flex items-center gap-3 rounded-2xl bg-cream px-5 py-3.5 text-[15px] text-green shadow-card">
        <span className="size-2.5 rounded-full bg-green" aria-hidden="true" />
        <span>
          <strong>No alerts.</strong> Everything is responding and within limits.
        </span>
      </p>
    )
  }

  return (
    <Card title="Alerts">
      <ul className="flex flex-col gap-3">
        {alerts.map((alert) => (
          <li key={alert.title} className="flex flex-wrap items-center gap-4 rounded-2xl bg-sand px-4 py-3.5">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${SEVERITY[alert.severity].badge}`}
            >
              {SEVERITY[alert.severity].label}
            </span>
            <div className="flex min-w-60 flex-1 flex-col gap-0.5">
              <span className="font-bold text-charcoal">{alert.title}</span>
              <span className="text-sm text-ink">{alert.detail}</span>
            </div>
            <span className="text-[13px] text-ink">
              {alert.source}
              {alert.since && ` · since ${formatTime(alert.since)}`}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default AlertsCard
