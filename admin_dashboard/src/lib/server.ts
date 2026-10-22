import { apiGet } from './api'

export type CheckStatus = 'up' | 'down' | 'pending' | 'maintenance'

export type Beat = { time: string; status: CheckStatus; pingMs: number | null }

export type Monitor = {
  name: string
  status: CheckStatus
  uptime24h: number | null
  pingMs: number | null
  lastCheck: string | null
  beats: Beat[]
}

export type Usage = { percent: number; usedBytes: number; totalBytes: number }

export type Host = {
  cpuPercent: number
  memory: Usage
  swap: Usage
  disk: Usage
  load1: number
  load5: number
  load15: number
  cpuCores: number
  uptime: string
}

export type Alert = {
  severity: 'critical' | 'warning'
  title: string
  detail: string
  source: string
  since: string | null
}

// monitors / host are null when Uptime Kuma / Glances isn't set up or didn't answer.
export type ServerMetrics = {
  monitors: Monitor[] | null
  host: Host | null
  alerts: Alert[]
}

export function getServerMetrics(): Promise<ServerMetrics> {
  return apiGet('/v1/admin/server')
}

const relative = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

// How long before now (a timestamp in ms) the time was: "20 seconds ago", "4 days ago".
export function timeAgo(iso: string, now: number): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000)
  if (seconds > -60) return relative.format(seconds, 'second')
  if (seconds > -3600) return relative.format(Math.round(seconds / 60), 'minute')
  if (seconds > -86400) return relative.format(Math.round(seconds / 3600), 'hour')
  return relative.format(Math.round(seconds / 86400), 'day')
}

export function gigabytes(bytes: number): string {
  return (bytes / 1024 ** 3).toFixed(1)
}
