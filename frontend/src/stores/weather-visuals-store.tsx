import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Saved on the phone, not the account: it's a display choice, like the phone's own reduce motion.
const STORAGE_KEY = 'weather-visuals';

interface WeatherVisualsStore {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const WeatherVisualsStoreContext = createContext<WeatherVisualsStore | undefined>(undefined);

export function WeatherVisualsStoreProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(
      (saved) => {
        if (saved === 'off') setEnabledState(false);
      },
      () => {},
    );
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    // Not saved (e.g. the device is full): the choice still holds until the app closes.
    AsyncStorage.setItem(STORAGE_KEY, value ? 'on' : 'off').catch(() => {});
  }, []);

  const value = useMemo(() => ({ enabled, setEnabled }), [enabled, setEnabled]);

  return <WeatherVisualsStoreContext.Provider value={value}>{children}</WeatherVisualsStoreContext.Provider>;
}

export function useWeatherVisualsStore(): WeatherVisualsStore {
  const context = useContext(WeatherVisualsStoreContext);
  if (!context) {
    throw new Error('useWeatherVisualsStore must be used within a WeatherVisualsStoreProvider');
  }
  return context;
}
