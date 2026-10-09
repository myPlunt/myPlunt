import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Lateef_500Medium, Lateef_600SemiBold } from '@expo-google-fonts/lateef';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { SplashOverlay } from '@/components/splash/splash-overlay';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useAuthStore();
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
        <SplashOverlay />
        <RootNavigator />
      </AuthStoreProvider>
    </ThemeProvider>
  );
}
