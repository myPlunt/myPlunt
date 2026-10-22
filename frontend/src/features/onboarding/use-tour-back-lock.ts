import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/** Only while focused, so a screen below doesn't swallow back presses meant for one above it. */
export function useTourBackLock(locked: boolean) {
  useFocusEffect(
    useCallback(() => {
      if (!locked) return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, [locked]),
  );
}
