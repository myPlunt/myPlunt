import '@/global.css';
import '@/lib/styling/css-interop';

import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Lateef_500Medium, Lateef_600SemiBold } from '@expo-google-fonts/lateef';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { OfflineNotice } from '@/components/layout/offline-notice';
import { SplashOverlay } from '@/components/splash/splash-overlay';
import { useScreenViewLogging } from '@/hooks/use-screen-view-logging';
import { startLogging } from '@/lib/logger';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';
import { NetworkStoreProvider } from '@/stores/network-store';
import { OnboardingStoreProvider } from '@/stores/onboarding-store';

SplashScreen.preventAutoHideAsync();
startLogging();

function RootNavigator() {
  const { status } = useAuthStore();
  useScreenViewLogging();
  const [fontsLoaded] = useFonts({
    Lateef_600SemiBold,
    Lateef_500Medium,
    DMSans_600SemiBold,
    DMSans_500Medium,
    DMSans_400Regular,
  });

  // Splash overlay stays up (it manages its own visibility) until we know
  // whether there's a stored session and the brand fonts are ready.
  if (status === 'loading' || !fontsLoaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
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
        <OnboardingStoreProvider>
          <NetworkStoreProvider>
            <SplashOverlay />
            <RootNavigator />
            {/* Floats over whichever screen is open. */}
            <OfflineNotice />
          </NetworkStoreProvider>
        </OnboardingStoreProvider>
      </AuthStoreProvider>
    </ThemeProvider>
  );
}
