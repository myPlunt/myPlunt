import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function DetailRow({ label, value, note }: { label: string; value: string; note?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="type-body-large text-text-secondary">{label}</Text>
      <View className="shrink items-end">
        <Text className="type-body-large text-right text-text">{value}</Text>
        {note}
      </View>
    </View>
  );
}
