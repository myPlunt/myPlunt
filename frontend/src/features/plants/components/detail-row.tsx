import { Text, View } from 'react-native';

/** A label and its value on one line of an information card, e.g. "Light · Full sun". */
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="type-body-large text-text-secondary">{label}</Text>
      <Text className="type-body-large shrink text-right text-text">{value}</Text>
    </View>
  );
}
