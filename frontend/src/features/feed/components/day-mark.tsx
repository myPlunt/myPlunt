import { Text, View } from 'react-native';

export function DayMark({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-action-primary px-3 py-1">
      <Text className="type-label uppercase text-background-element">{label}</Text>
    </View>
  );
}
