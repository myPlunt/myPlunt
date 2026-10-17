import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { LogDayCount } from '../../lib/logs'
import Card from './Card'
import ChartTooltip from './ChartTooltip'
import Legend from './Legend'
import { LEVELS, levelStyle } from './levels'

type Row = { day: string } & Record<string, number | string>

// One row per day, including days without lines, so the bars line up with the calendar.
function toRows(perDay: LogDayCount[], days: number): Row[] {
  const rows: Row[] = []
  const today = new Date()
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset))
    const key = date.toISOString().slice(0, 10)
    const row: Row = { day: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) }
    for (const item of perDay) {
      if (item.date === key) row[item.level] = item.count
    }
    rows.push(row)
  }
  return rows
}

function LogsPerDayChart({ perDay, days }: { perDay: LogDayCount[]; days: number }) {
  const levels = [...new Set(perDay.map((item) => item.level))].sort(
    (a, b) => Object.keys(LEVELS).indexOf(a) - Object.keys(LEVELS).indexOf(b),
  )

  return (
    <Card title="Log lines per day" subtitle="Stacked by type (UTC days).">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={toRows(perDay, days)} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--color-sand)" />
            <XAxis dataKey="day" tick={{ fill: 'var(--color-ink)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--color-ink)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-sand)', opacity: 0.5 }} />
            {levels.map((level, index) => (
              <Bar
                key={level}
                dataKey={level}
                name={levelStyle(level).label}
                stackId="levels"
                fill={levelStyle(level).color}
                radius={index === levels.length - 1 ? [6, 6, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={levels.map((level) => levelStyle(level))} />
    </Card>
  )
}

export default LogsPerDayChart
