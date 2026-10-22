import { levelStyle } from './levels'

function LevelBadge({ level }: { level: string }) {
  const style = levelStyle(level)
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${style.badge}`}>
      {style.label}
    </span>
  )
}

export default LevelBadge
