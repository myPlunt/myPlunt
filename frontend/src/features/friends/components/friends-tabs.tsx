import { Pressable, Text, View } from 'react-native';

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

/** The Friends screen's tabs: Find · Friends · Requests, the open one underlined in green. */
export function FriendsTabs({ tab, onChange, requestCount }: FriendsTabsProps) {
  return (
    <View accessibilityRole="tablist" className="flex-row border-b border-border">
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
            className="flex-1 flex-row items-center justify-center gap-1.5 pb-3 pt-2 active:opacity-70">
            <Text className={`type-button-medium ${selected ? 'text-text' : 'text-text-secondary'}`}>{label}</Text>
            {/* Sits over the strip's bottom border, so the open tab reads as joined to the content below. */}
            {selected && <View className="absolute -bottom-px left-4 right-4 h-[3px] rounded-t bg-action-primary" />}
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
