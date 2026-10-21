import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import ProblemsTable from '../components/logs/ProblemsTable'
import StatCards from '../components/logs/StatCards'
import AlertsCard from '../components/overview/AlertsCard'
import HostCard from '../components/overview/HostCard'
import MonitorCard from '../components/overview/MonitorCard'
import ReviewSpeciesCard from '../components/overview/ReviewSpeciesCard'
import PageHeader from '../components/PageHeader'
import { ApiError } from '../lib/api'
import { getLogOverview, type LogOverview } from '../lib/logs'
import { getServerMetrics, type ServerMetrics } from '../lib/server'
import { getPendingSpecies, type PendingSpecies } from '../lib/species'

const REFRESH_MS = 30_000

// fetchedAt: when the data came back; times on the page ("20 seconds ago") are relative to it.
type Data = { server: ServerMetrics; logs: LogOverview; pending: PendingSpecies[]; fetchedAt: number }

function OverviewPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Bumped by the Refresh button: loads now and restarts the 30 s timer.
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    let cancelled = false
    function load() {
      Promise.all([getServerMetrics(), getLogOverview(1), getPendingSpecies()])
        .then(([server, logs, pending]) => {
          if (cancelled) return
          setData({ server, logs, pending, fetchedAt: Date.now() })
          setError(null)
        })
        .catch((err) => {
          // Keeps showing the last numbers under the error.
          if (!cancelled) setError(err instanceof ApiError ? err.message : "Can't reach the server.")
        })
    }
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [reloads])

  const monitors = data?.server.monitors

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Overview" />
        <div className="flex items-center gap-3 text-sm text-ink">
          {data && (
            <span>
              Updated {new Date(data.fetchedAt).toLocaleTimeString('en-GB')} · refreshes every 30 s
            </span>
          )}
          <button
            type="button"
            onClick={() => setReloads((count) => count + 1)}
            className="min-h-11 rounded-full border border-green px-4 text-sm font-semibold text-green transition-opacity hover:opacity-80"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {error}
        </p>
      )}

      {data && (
        <>
          <AlertsCard alerts={data.server.alerts} />

          {monitors?.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {monitors.map((monitor) => (
                <MonitorCard key={monitor.name} monitor={monitor} now={data.fetchedAt} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl bg-cream p-6 text-sm text-ink shadow-card">
              {monitors
                ? 'The Uptime Kuma status page has no monitors on it yet.'
                : "No uptime checks: Uptime Kuma isn't set up (KUMA_URL, KUMA_STATUS_PAGE) or isn't answering."}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <HostCard host={data.server.host} className="lg:col-span-2" />
            <ReviewSpeciesCard pending={data.pending} now={data.fetchedAt} />
          </div>

          <section className="flex flex-col gap-4" aria-labelledby="logs-today">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="logs-today" className="font-primary text-4xl leading-none font-semibold text-green">
                Logs today
              </h2>
              <Link to="/logs" className="text-sm font-semibold text-green hover:text-leaf">
                Open logs →
              </Link>
            </div>
            <StatCards overview={data.logs} />
            <ProblemsTable problems={data.logs.topProblems} />
          </section>
        </>
      )}
    </>
  )
}

export default OverviewPage
