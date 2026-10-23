import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useWeatherVisualsStore, WeatherVisualsStoreProvider } from '@/stores/weather-visuals-store';

function renderStore() {
  return renderHook(() => useWeatherVisualsStore(), { wrapper: WeatherVisualsStoreProvider });
}

describe('WeatherVisualsStore', () => {
  it('remembers the animations being turned off after the app restarts', async () => {
    const first = await renderStore();
    expect(first.result.current.enabled).toBe(true);

    await act(async () => first.result.current.setEnabled(false));
    first.unmount();

    const second = await renderStore();
    await waitFor(() => expect(second.result.current.enabled).toBe(false));
  });
});
