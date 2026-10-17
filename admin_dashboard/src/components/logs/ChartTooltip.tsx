import type { TooltipContentProps } from 'recharts'

// Replaces Recharts' default tooltip, whose colors aren't from the palette.
function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2 text-sm shadow-card">
      {label !== undefined && <span className="font-semibold text-green">{label}</span>}
      {payload.map((item) => (
        <span key={String(item.name)} className="flex items-center gap-2 text-charcoal">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color ?? item.payload?.fill }} />
          {item.name}: <span className="font-semibold">{item.value}</span>
        </span>
      ))}
    </div>
  )
}

export default ChartTooltip
