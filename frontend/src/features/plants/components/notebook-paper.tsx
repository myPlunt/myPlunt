import { forwardRef, type ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Everything on the page is laid out in whole lines of this height, so labels sit
// on a rule and inputs, chips and buttons fill the space between two. Grid sizes go
// through style, not h-* classes: NativeWind's native rem is 14px, so h-10 is 35px
// and would drift away from the rules.
export const RULE_HEIGHT = 40;

/** Style for a view exactly one ruled line tall. */
export const oneLine = { height: RULE_HEIGHT };

// Gap kept between a box (input) and the rules above and below it, so its border
// never touches a line. Same room the 28px chips get inside a 40px line.
const BOX_GAP = 6;

/** Height of a box that spans `rows` lines but stays BOX_GAP clear of the rules. */
export function boxHeight(rows: number) {
  return rows * RULE_HEIGHT - 2 * BOX_GAP;
}

// Enough lines to cover a tall page; the parent clips the rest.
const RULE_COUNT = 60;

/**
 * Ruled lines filling their parent, starting with a line along its top edge. Put
 * them first inside the view that holds the rows, so they scroll with the rows and
 * stay lined up.
 */
export function NotebookRules() {
  return (
    // Decoration only: hidden from screen readers and from touches.
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

/** The vertical margin line (left-10). Page content starts to its right, e.g. with pl-14. */
export function NotebookMargin() {
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      className="absolute bottom-0 left-10 top-0 w-px bg-accent opacity-40"
    />
  );
}

/** Content written on the page: `rows` whole lines tall, with its text sitting on the bottom rule. */
export function RuledLine({ rows = 1, children }: { rows?: number; children?: ReactNode }) {
  return (
    // Height comes from the rows prop, so it can't be a static class.
    <View className="justify-end pb-1" style={{ height: rows * RULE_HEIGHT }}>
      {children}
    </View>
  );
}

interface RuledTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** How many lines the input spans: 1 for a single line, more for multiline. */
  rows?: number;
}

/**
 * FormField laid out on the ruled grid: a label line, an input taking up `rows`
 * lines (with a gap to the rules), and an error line only while there is an error.
 */
export const RuledTextField = forwardRef<TextInput, RuledTextFieldProps>(function RuledTextField(
  { label, error, rows = 1, multiline, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <View>
      <RuledLine>
        <Text className="type-label text-text-secondary">{label}</Text>
      </RuledLine>
      {/* The line(s) the input is written on; the input is centred inside, clear of the rules. */}
      <View className="justify-center" style={{ height: rows * RULE_HEIGHT }}>
        <TextInput
          ref={ref}
          className={`type-body-large rounded-[10px] border-[1.5px] bg-background-element px-4 text-text ${
            multiline ? 'py-2' : ''
          } ${error ? 'border-error' : 'border-input-border'}`}
          style={[
            // Height comes from the rows prop, so it can't be a static class.
            { height: boxHeight(rows) },
            // Android centres multiline text vertically by default; iOS starts at the top.
            multiline && { textAlignVertical: 'top' },
          ]}
          multiline={multiline}
          // A colour prop, not a style, so it can't take a class.
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
