import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * While the tour waits on this screen, Android's back button does nothing, so the user can't
 * leave a step half-done; the card's own buttons move the tour on. Only while the screen is
 * focused, so a screen below doesn't swallow back presses meant for one above it. iOS has no
 * back button; its swipe back is turned off per screen.
 */
export function useTourBackLock(locked: boolean) {
  useFocusEffect(
    useCallback(() => {
      if (!locked) return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, [locked]),
  );
}
