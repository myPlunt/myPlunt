import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import type { LogCount } from '../../lib/logs'
import Card from './Card'
import ChartTooltip from './ChartTooltip'
import Legend from './Legend'

type ShareDonutProps = {
  title: string
  subtitle: string
  counts: LogCount[]
  styleOf: (name: string) => { label: string; color: string }
}

function ShareDonut({ title, subtitle, counts, styleOf }: ShareDonutProps) {
  const total = counts.reduce((sum, item) => sum + item.count, 0)
  const data = counts.map((item) => ({ ...item, ...styleOf(item.name) }))

  return (
    <Card title={title} subtitle={subtitle}>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-primary text-[40px] leading-none font-semibold text-green">{total.toLocaleString('en-GB')}</span>
          <span className="text-xs text-ink">lines</span>
        </div>
      </div>
      <Legend items={data.map((item) => ({ label: `${item.label} · ${Math.round((item.count / (total || 1)) * 100)}%`, color: item.color }))} />
    </Card>
  )
}

export default ShareDonut
