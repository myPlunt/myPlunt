import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StagingPill } from '@/components/ui/staging-pill';

export function AuthScreenLayout({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 24 })}>
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerClassName="grow px-6 pb-6 pt-8"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View className="mb-6 items-center gap-1 self-center p-4">
              <Image className="h-20 w-[72px]" source={require('@/assets/images/Logo.png')} contentFit="contain" />
              <Text className="type-h5 text-primary">myPlunt</Text>
              <StagingPill />
            </View>

            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
