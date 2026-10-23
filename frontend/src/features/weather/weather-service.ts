import { apiFetch } from '@/lib/auth/api-client';
import type { CurrentWeather } from '@/lib/weather/types';

export async function getCurrentWeather(): Promise<CurrentWeather> {
  return apiFetch<CurrentWeather>('/v1/weather/current');
}
