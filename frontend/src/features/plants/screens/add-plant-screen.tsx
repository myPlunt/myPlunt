import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { useGarden } from '@/features/garden/use-garden';
import { AddPlantForm } from '@/features/plants/components/add-plant-form';
import {
  NotebookMargin,
  NotebookRules,
  RULE_HEIGHT,
  RuledLine,
} from '@/features/plants/components/notebook-paper';
import { useSpecies } from '@/features/species/use-species';

// Opened from the tab bar's + button; the whole page is a sheet of notebook paper.
// The photo comes in a later step.
export function AddPlantScreen() {
  const router = useRouter();
  // The garden's rooms are the user's planters; the group without an id is "Other plants".
  const { garden, error: plantersError } = useGarden();
  const { species, error: speciesError } = useSpecies();
  const planters = garden?.rooms.flatMap((room) => (room.id ? [{ id: room.id, name: room.name }] : [])) ?? null;

  return (
    <View className="flex-1 bg-background-element">
      <NotebookMargin />
      <KeyboardAvoidingView
        className="flex-1"
        // iOS needs padding to lift the content; Android resizes the window itself,
        // so shrinking the height is enough there.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
          <AppHeader showBack />

          <ScrollView
            contentContainerClassName="w-full max-w-content grow self-center"
            keyboardShouldPersistTaps="handled">
            {/* The title gets two lines of unruled space and sits on the first rule. */}
            <View className="justify-end pl-14 pr-6" style={styles.titleArea}>
              <Text accessibilityRole="header" className="type-h3 text-action-primary" style={styles.title}>
                Add your new plant
              </Text>
            </View>

            {/* The rules start here, along the top edge, and fill the rest of the page edge
                to edge (they cover the padding, so the content starts right of the margin). */}
            <View className="grow pl-14 pr-6" style={styles.ruled}>
              <NotebookRules />
              <RuledLine>
                <Text className="type-body-medium text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
                  The more we know, the better we&apos;ll remind you.
                </Text>
              </RuledLine>
              {/* Closing the sheet refocuses the garden, which reloads and shows the new plant. */}
              <AddPlantForm
                species={species}
                speciesError={speciesError}
                planters={planters}
                plantersError={plantersError}
                onCreated={() => router.back()}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sizes follow the ruled grid (RULE_HEIGHT), which classes can't express exactly.
  titleArea: { height: 2 * RULE_HEIGHT },
  ruled: { paddingBottom: RULE_HEIGHT },
  // Lateef's natural line is ~1.45× its size (tall marks above and below), and the
  // glyphs sit high in it. A full-height line stops iOS clipping the bottom, the
  // negative margin lowers the baseline onto the rule, and Android's extra font
  // padding is dropped so both platforms place it the same.
  title: {
    lineHeight: 58,
    marginBottom: -14,
    includeFontPadding: false,
  },
});
