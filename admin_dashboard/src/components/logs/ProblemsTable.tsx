import type { LogEventCount } from '../../lib/logs'
import Card from './Card'
import LevelBadge from './LevelBadge'
import { eventLabel, formatDateTime, locationLabel } from './levels'

function ProblemsTable({ problems }: { problems: LogEventCount[] }) {
  return (
    <Card title="Most frequent problems" subtitle="Errors, bugs and warnings, grouped by what went wrong.">
      {problems.length === 0 ? (
        <p className="text-sm text-ink">Nothing went wrong in this period.</p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs tracking-wider text-soil uppercase">
              <tr>
                <th className="px-2 py-2 font-semibold">What</th>
                <th className="px-2 py-2 font-semibold">Type</th>
                <th className="px-2 py-2 font-semibold">Where</th>
                <th className="px-2 py-2 text-right font-semibold">Times</th>
                <th className="px-2 py-2 text-right font-semibold">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr key={`${problem.event}-${problem.level}-${problem.location}`} className="border-t border-sand">
                  <td className="px-2 py-2.5 font-semibold text-charcoal">{eventLabel(problem.event)}</td>
                  <td className="px-2 py-2.5">
                    <LevelBadge level={problem.level} />
                  </td>
                  <td className="px-2 py-2.5 text-ink">{locationLabel(problem.location)}</td>
                  <td className="px-2 py-2.5 text-right font-semibold text-charcoal">{problem.count}</td>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap text-ink">{formatDateTime(problem.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default ProblemsTable
