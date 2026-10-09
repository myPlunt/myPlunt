import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { AddPlantForm } from '@/features/plants/components/add-plant-form';
import { NotebookPaper } from '@/features/plants/components/notebook-paper';

// Opened from the tab bar's + button. The photo comes in a later step.
export function AddPlantScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        // iOS needs padding to lift the content; Android resizes the window itself,
        // so shrinking the height is enough there.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
          <AppHeader showBack />

          <ScrollView
            contentContainerClassName="w-full max-w-content grow self-center p-6"
            keyboardShouldPersistTaps="handled">
            <NotebookPaper>
              <Text accessibilityRole="header" className="type-h3 text-action-primary">
                Meet your new plant
              </Text>
              <Text className="type-body-medium mb-4 text-text-secondary">
                The more we know, the better we&apos;ll remind you.
              </Text>
              {/* Closes the sheet; the garden will list the plant once its endpoint exists. */}
              <AddPlantForm onCreated={() => router.back()} />
            </NotebookPaper>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
