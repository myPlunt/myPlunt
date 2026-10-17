import { useEffect, useState } from 'react'

import { ApiError } from '../../lib/api'
import { getLogs, type LogFilters, type LogPage } from '../../lib/logs'
import Card from './Card'
import LevelBadge from './LevelBadge'
import { LEVELS, LOCATIONS, eventLabel, formatDateTime, locationLabel } from './levels'

type Result = { filters: LogFilters; page?: LogPage; error?: string }

const selectClass =
  'rounded-xl border border-sand bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-leaf'

function RecentLogs() {
  const [filters, setFilters] = useState<LogFilters>({ level: '', location: '', page: 0 })
  const [result, setResult] = useState<Result | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getLogs(filters)
      .then((page) => !cancelled && setResult({ filters, page }))
      .catch((err) => {
        if (!cancelled) setResult({ filters, error: err instanceof ApiError ? err.message : "Can't reach the server." })
      })
    return () => {
      cancelled = true
    }
  }, [filters])

  const loading = result?.filters !== filters
  const page = result?.page
  const lastPage = page ? Math.max(Math.ceil(page.total / page.size) - 1, 0) : 0

  function filter(change: Partial<LogFilters>) {
    setFilters((current) => ({ ...current, ...change, page: change.page ?? 0 }))
  }

  return (
    <Card title="All log lines" subtitle="Newest first. Click a line to see everything it logged.">
      <div className="flex flex-wrap gap-3">
        <select aria-label="Type" className={selectClass} value={filters.level} onChange={(e) => filter({ level: e.target.value })}>
          <option value="">All types</option>
          {Object.entries(LEVELS).map(([key, style]) => (
            <option key={key} value={key}>
              {style.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Where"
          className={selectClass}
          value={filters.location}
          onChange={(e) => filter({ location: e.target.value })}
        >
          <option value="">Backend and app</option>
          {Object.entries(LOCATIONS).map(([key, location]) => (
            <option key={key} value={key}>
              {location.label}
            </option>
          ))}
        </select>
        {page && <span className="self-center text-sm text-ink">{page.total.toLocaleString('en-GB')} lines</span>}
      </div>

      {result?.error ? (
        <p role="alert" className="text-sm font-semibold text-soil">
          {result.error}
        </p>
      ) : (
        <div className={`-mx-2 overflow-x-auto transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs tracking-wider text-soil uppercase">
              <tr>
                <th className="px-2 py-2 font-semibold">When</th>
                <th className="px-2 py-2 font-semibold">Type</th>
                <th className="px-2 py-2 font-semibold">Where</th>
                <th className="px-2 py-2 font-semibold">Event</th>
                <th className="px-2 py-2 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {page?.entries.map((entry) => (
                <LogRow
                  key={entry.id}
                  entry={entry}
                  open={openId === entry.id}
                  onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
                />
              ))}
              {page?.entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-ink">
                    No log lines match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {page && page.total > page.size && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <button
            type="button"
            disabled={filters.page === 0 || loading}
            onClick={() => filter({ page: filters.page - 1 })}
            className="rounded-full bg-white px-4 py-2 font-semibold text-green disabled:opacity-50"
          >
            Newer
          </button>
          <span className="text-ink">
            Page {filters.page + 1} of {lastPage + 1}
          </span>
          <button
            type="button"
            disabled={filters.page >= lastPage || loading}
            onClick={() => filter({ page: filters.page + 1 })}
            className="rounded-full bg-white px-4 py-2 font-semibold text-green disabled:opacity-50"
          >
            Older
          </button>
        </div>
      )}
    </Card>
  )
}

type LogRowProps = { entry: LogPage['entries'][number]; open: boolean; onToggle: () => void }

function LogRow({ entry, open, onToggle }: LogRowProps) {
  return (
    <>
      <tr
        onClick={onToggle}
        aria-expanded={open}
        className="cursor-pointer border-t border-sand align-top hover:bg-sand/40"
      >
        <td className="px-2 py-2.5 whitespace-nowrap text-ink">{formatDateTime(entry.loggedAt)}</td>
        <td className="px-2 py-2.5">
          <LevelBadge level={entry.level} />
        </td>
        <td className="px-2 py-2.5 text-ink">{locationLabel(entry.location)}</td>
        <td className="px-2 py-2.5 font-semibold text-charcoal">{eventLabel(entry.event)}</td>
        <td className="max-w-xs truncate px-2 py-2.5 text-ink">{entry.message ?? ''}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} className="px-2 pb-3">
            <pre className="overflow-x-auto rounded-xl bg-white p-4 text-xs leading-relaxed text-charcoal">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

export default RecentLogs
