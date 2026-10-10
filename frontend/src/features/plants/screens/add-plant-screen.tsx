import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { useGarden } from '@/features/garden/use-garden';
import { AddPlantForm } from '@/features/plants/components/add-plant-form';
import { NotebookPaper } from '@/features/plants/components/notebook-paper';

// Opened from the tab bar's + button; the whole page is a sheet of notebook paper.
// The photo comes in a later step.
export function AddPlantScreen() {
  const router = useRouter();
  // The garden's rooms are the user's planters; the group without an id is "Other plants".
  const { garden, error: plantersError } = useGarden();
  const planters = garden?.rooms.flatMap((room) => (room.id ? [{ id: room.id, name: room.name }] : [])) ?? null;

  return (
    <View className="flex-1 bg-background-element">
      <NotebookPaper />
      <KeyboardAvoidingView
        className="flex-1"
        // iOS needs padding to lift the content; Android resizes the window itself,
        // so shrinking the height is enough there.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
          <AppHeader showBack />

          <ScrollView
            contentContainerClassName="w-full max-w-content grow self-center pb-8 pl-14 pr-6 pt-2"
            keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" className="type-h3 text-action-primary">
              Meet your new plant
            </Text>
            <Text className="type-body-medium mb-4 text-text-secondary">
              The more we know, the better we&apos;ll remind you.
            </Text>
            {/* Closing the sheet refocuses the garden, which reloads and shows the new plant. */}
            <AddPlantForm planters={planters} plantersError={plantersError} onCreated={() => router.back()} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
