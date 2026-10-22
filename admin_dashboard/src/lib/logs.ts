import { apiGet } from './api'

export type LogCount = { name: string; count: number }

export type LogDayCount = { date: string; level: string; count: number }

export type LogEventCount = {
  event: string
  level: string
  location: string
  count: number
  lastSeen: string
}

export type LogOverview = {
  days: number
  total: number
  byLevel: LogCount[]
  byLocation: LogCount[]
  perDay: LogDayCount[]
  topActions: LogEventCount[]
  topProblems: LogEventCount[]
}

export type LogEntry = {
  id: number
  level: string
  loggedAt: string
  location: string
  event: string | null
  message: string | null
  details: Record<string, unknown>
}

export type LogPage = {
  entries: LogEntry[]
  total: number
  page: number
  size: number
}

export type LogFilters = { level: string; location: string; page: number }

export function getLogOverview(days: number): Promise<LogOverview> {
  return apiGet(`/v1/admin/logs/overview?days=${days}`)
}

export function getLogs({ level, location, page }: LogFilters): Promise<LogPage> {
  const params = new URLSearchParams({ page: String(page), size: '25' })
  if (level) params.set('level', level)
  if (location) params.set('location', location)
  return apiGet(`/v1/admin/logs?${params}`)
}
