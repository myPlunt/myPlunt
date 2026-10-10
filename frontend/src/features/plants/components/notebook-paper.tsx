import { View } from 'react-native';

// Enough rules to cover a tall screen; the parent clips the rest.
const RULE_COUNT = 60;

/**
 * Ruled notebook lines plus a margin line, filling its parent behind the content.
 * Put it first inside a `bg-background-element` view; content should start right of
 * the margin line (left-10), e.g. with `pl-14`.
 */
export function NotebookPaper() {
  return (
    // Decoration only: hidden from screen readers and from touches.
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 overflow-hidden">
      {Array.from({ length: RULE_COUNT }, (_, i) => (
        <View key={i} className="h-8 border-b border-input-border opacity-40" />
      ))}
      <View className="absolute bottom-0 left-10 top-0 w-px bg-accent opacity-40" />
    </View>
  );
}
