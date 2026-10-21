import { Text } from 'react-native';

/**
 * Says the page shows the copy saved on the device, as there's no connection for a fresh one:
 * "Offline · updated 21 Oct, 14:32".
 */
export function OfflineNote({ savedAt }: { savedAt: string }) {
  const updated = new Date(savedAt).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return <Text className="type-caption text-center text-text-secondary">{`Offline · updated ${updated}`}</Text>;
}
