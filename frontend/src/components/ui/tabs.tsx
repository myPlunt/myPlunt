import { Pressable, Text, View } from 'react-native';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** Shown as a count badge when above 0 (e.g. requests waiting for an answer). */
  badge?: number;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of equal-width tabs, the open one underlined in green. */
export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  return (
    <View accessibilityRole="tablist" className="flex-row border-b border-border">
      {tabs.map(({ value: tab, label, badge }) => {
        const selected = tab === value;
        const count = badge && badge > 0 ? badge : null;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityLabel={count ? `${label}, ${count} waiting` : label}
            accessibilityState={{ selected }}
            onPress={() => onChange(tab)}
            className="flex-1 flex-row items-center justify-center gap-1.5 pb-3 pt-2 active:opacity-70">
            <Text className={`type-button-medium ${selected ? 'text-text' : 'text-text-secondary'}`}>{label}</Text>
            {/* Sits over the strip's bottom border, so the open tab reads as joined to the content below. */}
            {selected && <View className="absolute -bottom-px left-4 right-4 h-[3px] rounded-t bg-action-primary" />}
            {count && (
              <View className="min-w-5 items-center rounded-full bg-action-primary px-1.5">
                <Text className="type-label text-background-element">{count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
