import { ActivityIndicator, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useNotificationSettings } from '@/features/profile/use-notification-settings';
import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationSettings } from '@/lib/user/types';

const OPTIONS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: 'waterReminders', label: 'Water reminders', description: 'When one of your plants needs water.' },
  { key: 'weatherAlerts', label: 'Weather alerts', description: 'Frost, heat or storms where your plants are.' },
  { key: 'friendActivity', label: 'Friend alerts', description: "News about your friends' plants." },
  { key: 'friendNudges', label: 'Friend nudges', description: 'When a friend reminds you to water your plants.' },
  { key: 'plantSitting', label: 'Plant sitting', description: 'When a friend asks you to look after their plants.' },
];

export function NotificationSettingsCard() {
  const theme = useTheme();
  const { settings, error, isLoading, retry, toggle } = useNotificationSettings();

  return (
    <View
      className="gap-2 rounded-2xl border-[1.5px] border-input-border bg-background-element px-4 py-3"
      style={Shadow.card}>
      <Text className="type-label text-accent">NOTIFICATIONS</Text>
      {isLoading ? (
        // Colour props (spinner, switch) read the theme instead of a class.
        <ActivityIndicator accessibilityLabel="Loading notification settings" color={theme.primary} />
      ) : (
        settings &&
        OPTIONS.map(({ key, label, description }) => (
          <View key={key} className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="type-body-medium text-text">{label}</Text>
              <Text className="type-caption text-text-secondary">{description}</Text>
            </View>
            {/* Same colours on both platforms; ios_backgroundColor fills the off track on iOS.
                Switch has no size prop, so it's scaled down to sit with the smaller text. */}
            <Switch
              className="scale-75"
              accessibilityLabel={label}
              value={settings[key]}
              onValueChange={(value) => toggle(key, value)}
              trackColor={{ false: theme.border, true: theme.actionPrimary }}
              ios_backgroundColor={theme.border}
              thumbColor={theme.backgroundElement}
            />
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
