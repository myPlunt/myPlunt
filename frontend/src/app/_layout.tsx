import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useAuthStore();

  // Splash overlay stays up (it manages its own visibility) until we know
  // whether there's a stored session.
  if (status === 'loading') {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={status !== 'authenticated'}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthStoreProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthStoreProvider>
    </ThemeProvider>
  );
}
