import { apiAction } from './api'

export const isStaging = import.meta.env.VITE_APP_VARIANT === 'staging'

// The backend only has these on staging.
export function resetDatabase(): Promise<void> {
  return apiAction('/v1/admin/jobs/reset-db', 'POST')
}

export function sendWeatherAlerts(): Promise<void> {
  return apiAction('/v1/admin/jobs/send-weather-alerts', 'POST')
}

export function skipDay(): Promise<void> {
  return apiAction('/v1/admin/jobs/skip-day', 'POST')
}

export function previewWeather(condition: 'rain' | 'wind' | 'snow'): Promise<void> {
  return apiAction(`/v1/admin/jobs/preview-${condition}`, 'POST')
}
