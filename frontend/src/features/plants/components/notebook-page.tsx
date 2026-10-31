import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoBackButton } from '@/components/layout/app-header';
import { NotebookMargin, NotebookRules, RULE_HEIGHT } from '@/features/plants/components/notebook-paper';
import { useKeepFocusedInputVisible } from '@/hooks/use-keep-focused-input-visible';

export function NotebookPage({ title, children }: { title: string; children: ReactNode }) {
  const scrollRef = useKeepFocusedInputVisible();

  return (
    <View className="flex-1 bg-background-element">
      <NotebookMargin />
      <KeyboardAvoidingView
        // style, not className: a flex-1 class overrides the height Android's "height" behavior sets.
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
          <ScrollView
            ref={scrollRef}
            contentContainerClassName="w-full max-w-content grow self-center"
            // Swiping the page or tapping blank paper closes the keyboard, uncovering Save.
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled">
            {/* w-10 matches the margin line's left-10, so w-10 + pl-4 lines the title up with the content's pl-14. */}
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
  titleArea: { height: 1.5 * RULE_HEIGHT },
  ruled: { paddingBottom: RULE_HEIGHT },
  // A full-height line stops iOS clipping Lateef; the negative margin lowers its high glyphs onto the rule.
  title: {
    lineHeight: 58,
    marginBottom: -14,
    includeFontPadding: false,
  },
});
