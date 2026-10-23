import { useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

const SWAY = { from: { transform: [{ translateX: -12 }] }, to: { transform: [{ translateX: 12 }] } };

const FLAKES = Array.from({ length: 35 }, () => {
  const duration = 5000 + Math.random() * 4000;
  return {
    left: Math.random() * 100,
    size: 3 + Math.random() * 4,
    opacity: 0.6 + Math.random() * 0.4,
    duration,
    // Negative, so the flakes are already spread over the screen on the first frame.
    delay: -Math.random() * duration,
    swayDuration: 1800 + Math.random() * 1400,
  };
});

export function SnowOverlay() {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  const fall = { from: { transform: [{ translateY: -20 }] }, to: { transform: [{ translateY: height }] } };

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 overflow-hidden">
      {FLAKES.map((flake, index) => (
        // Falling and swaying run on separate views, so the fall stays linear while the sway eases.
        <Animated.View
          key={index}
          className="absolute top-0"
          // Each flake's position, size and timing are random, which classes can't express.
          style={{
            left: `${flake.left}%`,
            animationName: fall,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
          }}>
          <Animated.View
            className="rounded-full bg-snow"
            style={{
              width: flake.size,
              height: flake.size,
              opacity: flake.opacity,
              animationName: SWAY,
              animationDuration: flake.swayDuration,
              animationDelay: flake.delay,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
            }}
          />
        </Animated.View>
      ))}
    </View>
  );
}
