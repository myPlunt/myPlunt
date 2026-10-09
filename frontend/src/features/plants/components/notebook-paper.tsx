import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Shadow } from '@/constants/theme';

// Enough rules to fill a tall page; the sheet clips the rest.
const RULE_COUNT = 60;

/** A sheet of ruled notebook paper (rules plus a margin line) that its children are written on. */
export function NotebookPaper({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl bg-background-element" style={Shadow.card}>
      {/* Decoration only: hidden from screen readers and from touches. */}
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" className="absolute inset-0">
        {Array.from({ length: RULE_COUNT }, (_, i) => (
          <View key={i} className="h-8 border-b border-input-border opacity-40" />
        ))}
        <View className="absolute bottom-0 left-8 top-0 w-px bg-accent opacity-40" />
      </View>
      <View className="py-6 pl-12 pr-5">{children}</View>
    </View>
  );
}
