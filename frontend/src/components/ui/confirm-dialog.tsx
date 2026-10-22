import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

/** Our own popup, not Alert.alert, so it can show a spinner and an error while the action runs. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
  error,
}: ConfirmDialogProps) {
  function cancel() {
    if (!loading) onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={cancel}
          className="absolute inset-0 bg-text opacity-40"
        />
        <View className="w-full max-w-[360px] gap-3 rounded-2xl bg-background-element p-5" style={Shadow.card}>
          <Text accessibilityRole="header" className="type-subtitle-large text-text">
            {title}
          </Text>
          <Text className="type-body-medium text-text-secondary">{message}</Text>
          {error && <Text className="type-body-medium text-error">{error}</Text>}
          <View className="mt-2 flex-row justify-end gap-3">
            <Button label="Cancel" variant="secondary" onPress={cancel} disabled={loading} />
            <Button label={confirmLabel} variant="destructive" onPress={onConfirm} loading={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
