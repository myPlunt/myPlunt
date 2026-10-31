import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { singleLineInputText } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Grid sizes go through style, not h-* classes: NativeWind's native rem is 14px, so h-10 is 35px.
export const RULE_HEIGHT = 40;

export const oneLine = { height: RULE_HEIGHT };

const BOX_GAP = 6;

export function boxHeight(rows: number) {
  return rows * RULE_HEIGHT - 2 * BOX_GAP;
}

// Enough lines to cover a tall page; the parent clips the rest.
const RULE_COUNT = 60;

/** Put it first inside the view that holds the rows, so the rules scroll with the rows. */
export function NotebookRules() {
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 overflow-hidden">
      {Array.from({ length: RULE_COUNT }, (_, i) => (
        <View key={i} className="border-t border-input-border opacity-40" style={oneLine} />
      ))}
    </View>
  );
}

export function NotebookMargin() {
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      className="absolute bottom-0 left-10 top-0 w-px bg-accent opacity-40"
    />
  );
}

export function RuledLine({ rows = 1, children }: { rows?: number; children?: ReactNode }) {
  return (
    <View className="justify-end pb-1" style={{ height: rows * RULE_HEIGHT }}>
      {children}
    </View>
  );
}

const RESIZE_MS = 200;

export function AnimatedLines({ rows, children }: { rows: number; children?: ReactNode }) {
  const [height] = useState(() => new Animated.Value(rows * RULE_HEIGHT));
  // So mounting, or re-rendering with the same rows, doesn't start an animation.
  const shownRows = useRef(rows);

  useEffect(() => {
    if (rows === shownRows.current) return;
    shownRows.current = rows;
    // Height can't run on the native driver; a short timing on the JS side is cheap enough.
    Animated.timing(height, {
      toValue: rows * RULE_HEIGHT,
      duration: RESIZE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [height, rows]);

  return <Animated.View style={{ height, overflow: 'hidden' }}>{children}</Animated.View>;
}

interface RuledTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  rows?: number;
}

export const RuledTextField = forwardRef<TextInputInstance, RuledTextFieldProps>(function RuledTextField(
  { label, error, rows = 1, multiline, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <View>
      <RuledLine>
        <Text className="type-label text-text-secondary">{label}</Text>
      </RuledLine>
      <View className="justify-center" style={{ height: rows * RULE_HEIGHT }}>
        <TextInput
          ref={ref}
          className={`rounded-[10px] border-[1.5px] bg-background-element px-4 text-text ${
            multiline ? 'type-body-large py-2' : ''
          } ${error ? 'border-error' : 'border-input-border'}`}
          style={[
            { height: boxHeight(rows) },
            // Android centres multiline text vertically by default; iOS starts at the top.
            multiline ? { textAlignVertical: 'top' } : singleLineInputText,
          ]}
          multiline={multiline}
          placeholderTextColor={theme.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          {...rest}
        />
      </View>
      {error && (
        <RuledLine>
          <Text className="type-caption text-error" numberOfLines={1} adjustsFontSizeToFit>
            {error}
          </Text>
        </RuledLine>
      )}
    </View>
  );
});
