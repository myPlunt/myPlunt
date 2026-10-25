import { RainOverlay } from '@/components/weather/rain-overlay';
import { SnowOverlay } from '@/components/weather/snow-overlay';
import { WindOverlay } from '@/components/weather/wind-overlay';
import type { WeatherCondition } from '@/lib/weather/types';

export function WeatherOverlay({ condition }: { condition: WeatherCondition }) {
  if (condition === 'RAIN') return <RainOverlay />;
  if (condition === 'SNOW') return <SnowOverlay />;
  if (condition === 'WIND') return <WindOverlay />;
  return null;
}
