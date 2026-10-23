import { useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

const TILT_DEGREES = 12;

// Up to 120% from the left: the slant carries drops leftwards, so the right edge still gets rain.
const DROPS = Array.from({ length: 40 }, () => {
  const duration = 700 + Math.random() * 500;
  return {
    left: Math.random() * 120,
    length: 14 + Math.random() * 16,
    opacity: 0.25 + Math.random() * 0.3,
    duration,
    // Negative, so the drops are already spread over the screen on the first frame.
    delay: -Math.random() * duration,
  };
});

export function RainOverlay() {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  const drift = -height * Math.tan((TILT_DEGREES * Math.PI) / 180);
  const fall = {
    from: { transform: [{ translateX: 0 }, { translateY: -40 }, { rotate: `${TILT_DEGREES}deg` }] },
    to: { transform: [{ translateX: drift }, { translateY: height }, { rotate: `${TILT_DEGREES}deg` }] },
  };

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 overflow-hidden">
      {DROPS.map((drop, index) => (
        <Animated.View
          key={index}
          className="absolute top-0 w-0.5 rounded-full bg-water"
          // Each drop's position, size and timing are random, which classes can't express.
          style={{
            left: `${drop.left}%`,
            height: drop.length,
            opacity: drop.opacity,
            animationName: fall,
            animationDuration: drop.duration,
            animationDelay: drop.delay,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
          }}
        />
      ))}
    </View>
  );
}
