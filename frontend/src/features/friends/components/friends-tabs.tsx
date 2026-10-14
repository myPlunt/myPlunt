import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';

export type FriendsTab = 'find' | 'friends' | 'requests';

const TABS: { tab: FriendsTab; label: string }[] = [
  { tab: 'find', label: 'Find' },
  { tab: 'friends', label: 'Friends' },
  { tab: 'requests', label: 'Requests' },
];

interface FriendsTabsProps {
  tab: FriendsTab;
  onChange: (tab: FriendsTab) => void;
  /** Received requests waiting for an answer; shown as a badge on Requests when above 0. */
  requestCount: number;
}

/** The Friends screen's segmented control: Find · Friends · Requests. */
export function FriendsTabs({ tab, onChange, requestCount }: FriendsTabsProps) {
  return (
    <View accessibilityRole="tablist" className="flex-row rounded-xl bg-background-element p-1">
      {TABS.map(({ tab: value, label }) => {
        const selected = value === tab;
        const badge = value === 'requests' && requestCount > 0 ? requestCount : null;
        return (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityLabel={badge ? `${label}, ${badge} waiting` : label}
            accessibilityState={{ selected }}
            onPress={() => onChange(value)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2 active:opacity-70 ${
              selected ? 'bg-background' : ''
            }`}
            style={selected ? Shadow.card : undefined}>
            <Text className={`type-button-medium ${selected ? 'text-text' : 'text-text-secondary'}`}>{label}</Text>
            {badge && (
              <View className="min-w-5 items-center rounded-full bg-action-primary px-1.5">
                <Text className="type-label text-background-element">{badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
