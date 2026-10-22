import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoBackButton } from '@/components/layout/app-header';
import { NotebookMargin, NotebookRules, RULE_HEIGHT } from '@/features/plants/components/notebook-paper';
import { useKeepFocusedInputVisible } from '@/hooks/use-keep-focused-input-visible';

/**
 * A whole screen as a sheet of notebook paper: the logo (back button) in the margin, the
 * title on the first rule, and the children written on the ruled lines below.
 */
export function NotebookPage({ title, children }: { title: string; children: ReactNode }) {
  const scrollRef = useKeepFocusedInputVisible();

  return (
    <View className="flex-1 bg-background-element">
      <NotebookMargin />
      <KeyboardAvoidingView
        className="flex-1"
        // iOS needs padding to lift the content; Android resizes the window itself,
        // so shrinking the height is enough there.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
          <ScrollView
            ref={scrollRef}
            contentContainerClassName="w-full max-w-content grow self-center"
            // Swiping the page or tapping blank paper closes the keyboard, uncovering Save.
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled">
            {/* One top row instead of a header plus a title: the logo (back button) sits in
                the margin (w-10 matches the margin line's left-10) and the title starts where
                the content column does (w-10 + pl-4 = pl-14), sitting on the first rule. */}
            <View className="flex-row items-end pr-6" style={styles.titleArea}>
              <View className="w-10 items-center pb-1">
                <LogoBackButton />
              </View>
              <Text
                accessibilityRole="header"
                className="type-h3 flex-1 pl-4 text-action-primary"
                numberOfLines={1}
                style={styles.title}>
                {title}
              </Text>
            </View>

            {/* The rules start here, along the top edge, and fill the rest of the page edge
                to edge (they cover the padding, so the content starts right of the margin). */}
            <View className="grow pl-14 pr-6" style={styles.ruled}>
              <NotebookRules />
              {children}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sizes follow the ruled grid (RULE_HEIGHT), which classes can't express exactly.
  titleArea: { height: 1.5 * RULE_HEIGHT },
  ruled: { paddingBottom: RULE_HEIGHT },
  // Lateef's natural line is ~1.45× its size (tall marks above and below), and the
  // glyphs sit high in it. A full-height line stops iOS clipping the bottom, the
  // negative margin lowers the baseline onto the rule, and Android's extra font
  // padding is dropped so both platforms place it the same.
  title: {
    lineHeight: 58,
    marginBottom: -14,
    includeFontPadding: false,
  },
});
