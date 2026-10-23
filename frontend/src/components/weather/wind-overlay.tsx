import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

const LEAF_COUNT = 4;

function randomFlight(run: number) {
  const duration = 4000 + Math.random() * 2000;
  return {
    run,
    top: 10 + Math.random() * 70,
    size: 14 + Math.random() * 6,
    rise: 20 + Math.random() * 60,
    fall: Math.random() * 60 - 20,
    spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360),
    duration,
    // The first flight starts part-way, so the leaves are spread over the screen from the start;
    // later ones wait a moment, so the leaves don't come in a steady stream.
    delay: run === 0 ? -Math.random() * duration : Math.random() * 1500,
  };
}

function Leaf() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [flight, setFlight] = useState(() => randomFlight(0));

  useEffect(() => {
    const timer = setTimeout(() => setFlight(randomFlight(flight.run + 1)), flight.duration + flight.delay);
    return () => clearTimeout(timer);
  }, [flight]);

  const across = {
    from: { transform: [{ translateX: -30 }] },
    to: { transform: [{ translateX: width + 30 }] },
  };
  const float = {
    '0%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
    '50%': { transform: [{ translateY: -flight.rise }, { rotate: `${flight.spin / 2}deg` }] },
    '100%': { transform: [{ translateY: flight.fall }, { rotate: `${flight.spin}deg` }] },
  };
  const timing = {
    animationDuration: flight.duration,
    animationDelay: flight.delay,
    // Holds the off-screen first and last frames, so the leaf never shows at its resting spot.
    animationFillMode: 'both',
  } as const;

  return (
    // A new key per flight remounts the view, so the animation restarts from the left.
    <Animated.View
      key={flight.run}
      className="absolute left-0"
      // Each flight's position and timing are random, 
      style={{ top: `${flight.top}%`, animationName: across, animationTimingFunction: 'linear', ...timing }}>
      {/* Up and down on its own view */}
      <Animated.View style={{ animationName: float, animationTimingFunction: 'ease-in-out', ...timing }}>
        <SymbolView
          name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }}
          tintColor={theme.primary}
          size={flight.size}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function WindOverlay() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 overflow-hidden">
      {Array.from({ length: LEAF_COUNT }, (_, index) => (
        <Leaf key={index} />
      ))}
    </View>
  );
}
