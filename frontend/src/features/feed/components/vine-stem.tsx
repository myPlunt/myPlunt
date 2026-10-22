import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { vinePath } from '@/features/feed/vine-path';
import { useTheme } from '@/hooks/use-theme';

const STEM_BOX_WIDTH = 110;
const STEM_BASE_WIDTH = 4.5;
const STEM_TIP_WIDTH = 1.5;
const LEAF_SIZE = 22;
// Where the icon's stalk is, from its left edge: SF Symbols' leaf.fill has it bottom right,
// Material's eco bottom left.
const LEAF_STALK_X = Platform.select({ ios: LEAF_SIZE - 3, default: 3 });
// The icon has padding below its stalk; this overlap makes the leaf grow out of the stem's tip.
const LEAF_STALK_OVERLAP = 6;

export function VineStem() {
  const theme = useTheme();
  const [height, setHeight] = useState(0);
  const { segments, tip } = vinePath(STEM_BOX_WIDTH, Math.max(height - LEAF_SIZE, 0));

  return (
    <View className="min-h-24 grow self-stretch" onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {/* Absolute, so the drawing never sizes the box it's measured from (a tall stem couldn't shrink again). */}
      {height > 0 && (
        <View className="absolute inset-x-0 top-0 items-center">
          <View>
            <Svg width={STEM_BOX_WIDTH} height={height}>
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
            {/* Carries the stem on below the box, so the iOS bounce shows more stem, not empty space. */}
            <View
              className="absolute top-full h-[2000px] bg-primary"
              style={{
                left: (STEM_BOX_WIDTH - STEM_BASE_WIDTH) / 2,
                width: STEM_BASE_WIDTH,
              }}
            />
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
