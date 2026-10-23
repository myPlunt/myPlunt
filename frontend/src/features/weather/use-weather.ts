import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { WeatherCondition } from '@/lib/weather/types';

import { getCurrentWeather } from './weather-service';

export function useWeather() {
  const [condition, setCondition] = useState<WeatherCondition>('NONE');

  useEffect(() => {
    // The visuals are decoration, so a failed call just keeps the last weather.
    const load = () => getCurrentWeather().then((weather) => setCondition(weather.condition), () => {});
    load();
    // Fetched again on return to the app, since the weather may have changed meanwhile.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => subscription.remove();
  }, []);

  return condition;
}
