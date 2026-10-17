import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis, type LabelProps } from 'recharts'

import type { LogDayCount } from '../../lib/logs'
import Card from './Card'
import Legend from './Legend'
import { LEVELS, levelStyle } from './levels'

type Row = { day: string; total: number } & Record<string, number | string>

// Smaller segments have no room for their count; the day's total above the bar still covers them.
const MIN_SEGMENT_HEIGHT = 18
const MIN_SEGMENT_WIDTH = 24

// textColor, not fill: LabelList passes its own fill to the content and would override it.
function SegmentCount({ x, y, width, height, value, textColor }: LabelProps & { textColor: string }) {
  if (!value || Number(height) < MIN_SEGMENT_HEIGHT || Number(width) < MIN_SEGMENT_WIDTH) return null
  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) + Number(height) / 2}
      fill={textColor}
      fontSize={11}
      fontWeight={600}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {value}
    </text>
  )
}

function DayTotal({ x, y, width, value }: LabelProps) {
  if (!value) return null
  return (
    <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} fill="var(--color-charcoal)" fontSize={12} fontWeight={600} textAnchor="middle">
      {value}
    </text>
  )
}

// One row per day, including days without lines, so the bars line up with the calendar.
function toRows(perDay: LogDayCount[], days: number): Row[] {
  const rows: Row[] = []
  const today = new Date()
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset))
    const key = date.toISOString().slice(0, 10)
    const row: Row = { day: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }), total: 0 }
    for (const item of perDay) {
      if (item.date !== key) continue
      row[item.level] = item.count
      row.total += item.count
    }
    rows.push(row)
  }
  return rows
}

function LogsPerDayChart({ perDay, days }: { perDay: LogDayCount[]; days: number }) {
  // At 90 days the bars are too narrow for a number above each one.
  const showTotals = days <= 30
  const levels = [...new Set(perDay.map((item) => item.level))].sort(
    (a, b) => Object.keys(LEVELS).indexOf(a) - Object.keys(LEVELS).indexOf(b),
  )

  return (
    <Card title="Log lines per day" subtitle="Stacked by type (UTC days).">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {/* Keyed by the levels: Recharts stacks bars in the order they first mounted, so a level that
              appears when the range changes would land on top of the stack instead of in its place. */}
          <BarChart key={levels.join()} data={toRows(perDay, days)} margin={{ top: 24, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--color-sand)" />
            <XAxis dataKey="day" tick={{ fill: 'var(--color-ink)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--color-ink)', fontSize: 12 }} axisLine={false} tickLine={false} />
            {levels.map((level, index) => (
              <Bar
                key={level}
                dataKey={level}
                name={levelStyle(level).label}
                stackId="levels"
                fill={levelStyle(level).color}
                radius={index === levels.length - 1 ? [6, 6, 0, 0] : 0}
              >
                {/* Sand (debug) is too light for white text. */}
                <LabelList
                  dataKey={level}
                  content={<SegmentCount textColor={level === 'debug' ? 'var(--color-charcoal)' : 'var(--color-white)'} />}
                />
                {showTotals && index === levels.length - 1 && <LabelList dataKey="total" content={<DayTotal />} />}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={levels.map((level) => levelStyle(level))} />
    </Card>
  )
}

export default LogsPerDayChart
