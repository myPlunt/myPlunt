// One palette color per log type, used by every chart, legend and badge on the Logs page. The
// palette has no red, so errors use the darkest neutral. Class names are written out in full so
// Tailwind finds them.
type LevelStyle = { label: string; color: string; badge: string }

export const LEVELS: Record<string, LevelStyle> = {
  error: { label: 'Error', color: 'var(--color-charcoal)', badge: 'bg-charcoal text-white' },
  bug: { label: 'Bug', color: 'var(--color-ink)', badge: 'bg-ink text-white' },
  warning: { label: 'Warning', color: 'var(--color-soil)', badge: 'bg-soil text-white' },
  action: { label: 'Action', color: 'var(--color-leaf)', badge: 'bg-leaf text-white' },
  info: { label: 'Info', color: 'var(--color-green)', badge: 'bg-green text-white' },
  debug: { label: 'Debug', color: 'var(--color-sand)', badge: 'bg-sand text-charcoal' },
}

const FALLBACK: LevelStyle = { label: 'Other', color: 'var(--color-ink)', badge: 'bg-sand text-charcoal' }

export function levelStyle(level: string): LevelStyle {
  return LEVELS[level] ?? { ...FALLBACK, label: level }
}

export const LOCATIONS: Record<string, { label: string; color: string }> = {
  backend: { label: 'Backend', color: 'var(--color-green)' },
  frontend: { label: 'App', color: 'var(--color-leaf)' },
}

export function locationLabel(location: string): string {
  return LOCATIONS[location]?.label ?? location
}

// plant_delete_submitted -> Plant delete submitted
export function eventLabel(event: string | null): string {
  if (!event) return '—'
  const words = event.replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
