import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import type { LogCount } from '../../lib/logs'
import Card from './Card'

type ShareDonutProps = {
  title: string
  subtitle: string
  counts: LogCount[]
  styleOf: (name: string) => { label: string; color: string }
}

// No tooltip: clicking a slice (or its legend entry) shows its count in the middle of the ring
// and fades the other slices; clicking it again goes back to the total.
function ShareDonut({ title, subtitle, counts, styleOf }: ShareDonutProps) {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const total = counts.reduce((sum, item) => sum + item.count, 0)
  const data = counts.map((item) => ({
    ...item,
    ...styleOf(item.name),
    percent: Math.round((item.count / (total || 1)) * 100),
  }))
  const selected = data.find((item) => item.name === selectedName)

  function toggle(name: string) {
    setSelectedName((current) => (current === name ? null : name))
  }

  return (
    <Card title={title} subtitle={subtitle}>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
              className="cursor-pointer"
              onClick={(_, index) => toggle(data[index].name)}
            >
              {data.map((item) => (
                <Cell
                  key={item.name}
                  fill={item.color}
                  fillOpacity={selected && selected.name !== item.name ? 0.25 : 1}
                  className="transition-[fill-opacity] duration-200"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-primary text-[40px] leading-none font-semibold text-green">
            {(selected?.count ?? total).toLocaleString('en-GB')}
          </span>
          <span className="text-xs text-ink">{selected ? `${selected.label} · ${selected.percent}%` : 'lines'}</span>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2 text-sm text-ink">
        {data.map((item) => (
          <li key={item.name}>
            <button
              type="button"
              onClick={() => toggle(item.name)}
              aria-pressed={selectedName === item.name}
              className={`flex items-center gap-2 rounded-full px-3 py-1 transition-colors ${selectedName === item.name ? 'bg-sand text-charcoal' : 'hover:bg-sand/60'}`}
            >
              {/* style: the color is a CSS variable picked per item, which a class can't express. */}
              <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label} · {item.percent}%
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default ShareDonut
