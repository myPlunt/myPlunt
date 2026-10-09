import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAuthActions } from '@/features/auth/use-auth-actions';
import { useTheme } from '@/hooks/use-theme';

// Placeholder until the backend exposes the current user's profile.
const PLACEHOLDER_PROFILE = {
  username: 'Username',
  email: 'email@example.com',
};

export function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { logout } = useAuthActions();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader onBrandPress={() => router.dismissTo('/')} />

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.identity}>
            <UserAvatar size={96} />
            <ThemedText style={[Typography.h4, { color: theme.text }]}>{PLACEHOLDER_PROFILE.username}</ThemedText>
            <ThemedText style={[Typography.bodyMedium, { color: theme.textSecondary }]}>
              {PLACEHOLDER_PROFILE.email}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText style={[Typography.label, { color: theme.accent }]}>ACCOUNT</ThemedText>
            <ThemedText style={[Typography.bodyLarge, { color: theme.textSecondary }]}>
              Profile and settings options will appear here.
            </ThemedText>
          </ThemedView>

          <Button label="Log out" variant="secondary" size="large" onPress={logout} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
