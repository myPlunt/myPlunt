import type { LogOverview } from '../../lib/logs'

function countOf(list: LogOverview['byLevel'], name: string): number {
  return list.find((item) => item.name === name)?.count ?? 0
}

function StatCards({ overview }: { overview: LogOverview }) {
  const stats = [
    { label: 'Log lines', value: overview.total },
    { label: 'Actions', value: countOf(overview.byLevel, 'action') },
    { label: 'Warnings', value: countOf(overview.byLevel, 'warning') },
    { label: 'Errors & bugs', value: countOf(overview.byLevel, 'error') + countOf(overview.byLevel, 'bug') },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 rounded-3xl bg-cream p-5 shadow-card">
          <span className="text-xs font-semibold tracking-wider text-soil uppercase">{stat.label}</span>
          <span className="font-primary text-[44px] leading-none font-semibold text-green">
            {stat.value.toLocaleString('en-GB')}
          </span>
        </div>
      ))}
    </div>
  )
}

export default StatCards
