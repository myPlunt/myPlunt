import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { SpeciesPicture } from '@/features/pluntdex/components/species-picture';
import type { Species } from '@/lib/species/types';

interface DiscoveryDialogProps {
  species: Species | null;
  number: string;
  onClose: () => void;
}

export function DiscoveryDialog({ species, number, onClose }: DiscoveryDialogProps) {
  return (
    <Modal visible={species !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="absolute inset-0 bg-text opacity-40"
        />
        {species && (
          <View
            className="w-full max-w-[360px] items-center gap-3 rounded-3xl bg-background-element p-6"
            style={Shadow.card}>
            <Text className="type-label text-accent">NEW IN YOUR PLUNTDEX</Text>
            <SpeciesPicture species={species} discovered className="aspect-square w-40 rounded-2xl" iconSize={48} />
            <Text accessibilityRole="header" className="type-h4 text-action-primary" style={styles.title}>
              Just discovered!
            </Text>
            <Text className="type-body-large text-center text-text">
              #{number} {species.commonName}
            </Text>
            <Button label="Nice!" onPress={onClose} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Lateef needs a taller line than type-h4's or iOS clips its glyphs. A style, as leading-* loses to type-h4.
  title: {
    lineHeight: 46,
    includeFontPadding: false,
  },
});
