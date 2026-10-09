import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AuthScreenLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 24 })}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedView style={[styles.brand]}>
              <Image style={styles.logo} source={require('@/assets/images/Logo.png')} contentFit="contain" />
              <ThemedText style={[Typography.h5, { color: theme.primary }]}>MyPlunt</ThemedText>
            </ThemedView>

            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  brand: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.four,
    padding: Spacing.three,
  },
  logo: {
    width: 72,
    height: 80,
  },
});
