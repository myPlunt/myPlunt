import type { SymbolViewProps } from 'expo-symbols';

import type { Light } from '@/lib/plant/types';

/** Every light level with its label and icon, in order from brightest to darkest. */
export const lightOptions: { value: Light; label: string; icon: SymbolViewProps['name'] }[] = [
  { value: 'full_sun', label: 'Full sun', icon: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' } },
  {
    value: 'bright_indirect',
    label: 'Bright indirect',
    icon: { ios: 'sun.haze.fill', android: 'light_mode', web: 'light_mode' },
  },
  {
    value: 'partial_shade',
    label: 'Partial shade',
    icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
  },
  { value: 'low_light', label: 'Low light', icon: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' } },
];
