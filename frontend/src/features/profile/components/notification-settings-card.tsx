import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
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
  const { settings, error, isLoading, retry, toggle } = useNotificationSettings();

  return (
    <View
      className="gap-2 rounded-2xl border-[1.5px] border-input-border bg-background-element px-4 py-3"
      style={Shadow.card}>
      <Text className="type-label text-accent">NOTIFICATIONS</Text>
      {isLoading ? (
        // Colour props (spinner) read the theme instead of a class.
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

// Our own toggle instead of the native Switch, which looks different on each platform (Liquid Glass on
// iOS). On is a light Fern track with a Hunter Green border and knob; the knob slides and the colours fade.
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(checked ? 1 : 0));

  useEffect(() => {
    // Colours can't run on the native driver, and one value drives both colour and position.
    Animated.timing(progress, { toValue: checked ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [checked, progress]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      hitSlop={8}
      className="active:opacity-70">
      {/* Animated values go through style; colour props read the theme instead of a class. */}
      <Animated.View
        className="h-6 w-10 justify-center rounded-full border-[1.5px] px-1"
        style={{
          backgroundColor: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.background, theme.toggleOnTrack],
          }),
          borderColor: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.inputBorder, theme.actionPrimary],
          }),
        }}>
        <Animated.View
          className="h-4 w-4 rounded-full"
          style={{
            backgroundColor: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [theme.inputBorder, theme.actionPrimary],
            }),
            // Track 40 - 3 border - 8 padding - 16 knob = 13px of travel, 4px clear of each end.
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 13] }) }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
