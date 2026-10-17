import { useEffect, useState } from 'react'

import LogsPerDayChart from '../components/logs/LogsPerDayChart'
import ProblemsTable from '../components/logs/ProblemsTable'
import RecentLogs from '../components/logs/RecentLogs'
import ShareDonut from '../components/logs/ShareDonut'
import StatCards from '../components/logs/StatCards'
import TopActionsChart from '../components/logs/TopActionsChart'
import { LOCATIONS, levelStyle } from '../components/logs/levels'
import PageHeader from '../components/PageHeader'
import { ApiError } from '../lib/api'
import { getLogOverview, type LogOverview } from '../lib/logs'

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

type Result = { days: number; overview?: LogOverview; error?: string }

function LogsPage() {
  const [days, setDays] = useState(7)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    let cancelled = false
    getLogOverview(days)
      .then((overview) => !cancelled && setResult({ days, overview }))
      .catch((err) => {
        if (!cancelled) setResult({ days, error: err instanceof ApiError ? err.message : "Can't reach the server." })
      })
    return () => {
      cancelled = true
    }
  }, [days])

  // Keeps showing the previous range while the new one loads, faded.
  const loading = result?.days !== days
  const overview = result?.overview

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Logs" description="Everything the backend and the app have logged." />
        <div className="flex shrink-0 gap-1 self-start rounded-full bg-cream p-1 shadow-card sm:self-auto" role="group" aria-label="Period">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              aria-pressed={days === range.days}
              onClick={() => setDays(range.days)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                days === range.days ? 'bg-green text-white' : 'text-green hover:bg-sand'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {result?.error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {result.error}
        </p>
      )}

      {overview && (
        <div className={`flex flex-col gap-6 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <StatCards overview={overview} />
          <LogsPerDayChart perDay={overview.perDay} days={overview.days} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ShareDonut title="By type" subtitle="Errors, warnings, actions and info." counts={overview.byLevel} styleOf={levelStyle} />
            <ShareDonut
              title="Backend vs app"
              subtitle="Where each line was logged."
              counts={overview.byLocation}
              styleOf={(name) => LOCATIONS[name] ?? { label: name, color: 'var(--color-ink)' }}
            />
          </div>
          <TopActionsChart actions={overview.topActions} />
          <ProblemsTable problems={overview.topProblems} />
        </div>
      )}

      <RecentLogs />
    </>
  )
}

export default LogsPage
