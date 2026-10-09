import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 600;

// Background must match the expo-splash-screen backgroundColor in app.config.js
// (sandDune = bg-background), so the hand-off from the native splash is seamless.
const OVERLAY_CLASSES = 'absolute inset-0 z-[1000] items-center justify-center bg-background';

export function SplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  // Same size as the native splash image in app.config.js (imageWidth 76).
  const image = <Image className="h-[84px] w-[76px]" source={require('@/assets/images/Logo.png')} />;

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      className={OVERLAY_CLASSES}>
      {image}
    </Animated.View>
  ) : (
    <View
      testID="splash-overlay"
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      className={OVERLAY_CLASSES}>
      {image}
    </View>
  );
}
