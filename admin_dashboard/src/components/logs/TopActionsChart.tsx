import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

import type { LogEventCount } from '../../lib/logs'
import Card from './Card'
import Legend from './Legend'
import { LOCATIONS, eventLabel } from './levels'

function TopActionsChart({ actions }: { actions: LogEventCount[] }) {
  const data = actions.map((action) => ({
    ...action,
    label: eventLabel(action.event),
    color: LOCATIONS[action.location]?.color ?? 'var(--color-ink)',
  }))

  return (
    <Card title="Most common actions" subtitle="What users did, as the app and the backend record it.">
      {data.length === 0 ? (
        <p className="text-sm text-ink">No actions in this period.</p>
      ) : (
        <div style={{ height: data.length * 34 + 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={190}
                tick={{ fill: 'var(--color-charcoal)', fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="count" name="Times" radius={[0, 6, 6, 0]} barSize={20}>
                {data.map((item) => (
                  <Cell key={`${item.event}-${item.location}`} fill={item.color} />
                ))}
                <LabelList dataKey="count" position="right" fill="var(--color-charcoal)" fontSize={12} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <Legend items={Object.values(LOCATIONS)} />
    </Card>
  )
}

export default TopActionsChart
