import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { useNotificationSettings } from '@/features/profile/use-notification-settings';
import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationSettings } from '@/lib/user/types';

const OPTIONS: {
  key: keyof NotificationSettings;
  label: string;
  description: string;
}[] = [
  {
    key: 'waterReminders',
    label: 'Water reminders',
    description: 'When one of your plants needs water.',
  },
  {
    key: 'weatherAlerts',
    label: 'Weather alerts',
    description: 'Frost, heat or storms where your plants are.',
  },
  {
    key: 'friendActivity',
    label: 'Friend alerts',
    description: "News about your friends' plants.",
  },
  {
    key: 'postInteractions',
    label: 'Likes & comments',
    description: 'When friends like or comment on your posts, or reply where you commented.',
  },
  {
    key: 'friendNudges',
    label: 'Friend nudges',
    description: 'When a friend reminds you to water your plants.',
  },
  {
    key: 'plantSitting',
    label: 'Plant sitting',
    description: 'When a friend asks you to look after their plants.',
  },
];

export function NotificationSettingsCard() {
  const theme = useTheme();
  const { settings, allowed, error, isLoading, retry, toggle, turnOn } = useNotificationSettings();

  return (
    <View
      className="gap-2 rounded-2xl border-[1.5px] border-input-border bg-background-element px-4 py-3"
      style={Shadow.card}>
      <Text className="type-label text-accent">NOTIFICATIONS</Text>
      {allowed === false && (
        <View className="items-start gap-2">
          <Text className="type-body-medium text-text-secondary">
            Notifications are off for myPlunt on this phone, so you won&apos;t get any of these.
          </Text>
          <Button label="Turn on notifications" variant="secondary" onPress={turnOn} />
        </View>
      )}
      {isLoading ? (
        <ActivityIndicator accessibilityLabel="Loading notification settings" color={theme.primary} />
      ) : (
        settings &&
        OPTIONS.map(({ key, label, description }) => (
          <View key={key} className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="type-body-medium text-text">{label}</Text>
              <Text className="type-caption text-text-secondary">{description}</Text>
            </View>
            <Toggle label={label} checked={settings[key]} onChange={(value) => toggle(key, value)} />
          </View>
        ))
      )}
      {error && (
        <View className="items-start gap-3">
          <Text className="type-body-medium text-error">{error}</Text>
          {!settings && <Button label="Try again" variant="secondary" onPress={retry} />}
        </View>
      )}
    </View>
  );
}
