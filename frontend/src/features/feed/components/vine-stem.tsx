import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { vinePath } from '@/features/feed/vine-path';
import { useTheme } from '@/hooks/use-theme';

// Room for the stem to sway left and right of the centre line.
const STEM_BOX_WIDTH = 110;
// Stroke width at the base and at the tip, where it matches the leaf icon's stalk.
const STEM_BASE_WIDTH = 4.5;
const STEM_TIP_WIDTH = 1.5;
// The leaf icon at the top, and the room it needs above the stem.
const LEAF_SIZE = 22;
// Where the icon's stalk is, from its left edge: SF Symbols' leaf.fill has it bottom right,
// Material's eco bottom left.
const LEAF_STALK_X = Platform.select({ ios: LEAF_SIZE - 3, default: 3 });
// The icon has padding below its stalk; moving it down this far makes the stalk overlap
// the stem's tip, so the leaf grows out of the stem instead of floating above it.
const LEAF_STALK_OVERLAP = 6;

/** The vine's stem: fills the space it's given, curving irregularly up from the bottom to a leaf. */
export function VineStem() {
  const theme = useTheme();
  // The path is drawn to the measured height, so the stem always reaches the top.
  const [height, setHeight] = useState(0);
  const { segments, tip } = vinePath(STEM_BOX_WIDTH, Math.max(height - LEAF_SIZE, 0));

  return (
    <View className="min-h-24 grow self-stretch" onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {/* Absolute, so the drawing never sizes the box it's measured from: otherwise a stem
          drawn tall can't shrink again, and its base slips under the tab bar, off centre. */}
      {height > 0 && (
        <View className="absolute inset-x-0 top-0 items-center">
          <View>
            {/* Shifted down by the leaf's height, so the leaf fits above the stem's tip. */}
            <Svg width={STEM_BOX_WIDTH} height={height}>
              {/* A colour prop, so it reads the theme instead of a class. Each bend is a bit
                thinner than the one below it, so the stem tapers into the leaf's stalk. */}
              {segments.map((segment) => (
                <Path
                  key={segment.d}
                  d={segment.d}
                  transform={`translate(0 ${LEAF_SIZE})`}
                  stroke={theme.primary}
                  strokeWidth={STEM_BASE_WIDTH - (STEM_BASE_WIDTH - STEM_TIP_WIDTH) * segment.progress}
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
            </Svg>
            {/* The stem carries on straight below the box, so pulling past the bottom (the iOS
              bounce) shows more stem instead of empty space. Computed from the stem's
              width and centre, so it needs a style. */}
            <View
              className="absolute top-full h-[2000px] bg-primary"
              style={{
                left: (STEM_BOX_WIDTH - STEM_BASE_WIDTH) / 2,
                width: STEM_BASE_WIDTH,
              }}
            />
            {/* The leaf from the Garden tab (Material's leaf on Android, whose tab shows a
              potted plant). Positioned from the computed tip, so it needs a style, with its
              stalk on the stem's tip. */}
            <SymbolView
              name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }}
              tintColor={theme.primary}
              size={LEAF_SIZE}
              style={{
                position: 'absolute',
                left: tip.x - LEAF_STALK_X,
                top: tip.y + LEAF_STALK_OVERLAP,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
