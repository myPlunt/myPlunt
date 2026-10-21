import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/auth/api-client';
import { type FrontendEvent, logFailedUi } from '@/lib/logger';
import { useTourBack } from '@/features/onboarding/use-tour-back';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { ONBOARDING_STEPS, type TourStep, useOnboardingStore } from '@/stores/onboarding-store';

type Icon = SymbolViewProps['name'];

interface PermissionStepProps {
  step: TourStep;
  /** Shown after "Step x of N". */
  stepLabel: string;
  icon: Icon;
  title: string;
  subtitle: string;
  reasons: { icon: Icon; title: string; body: string }[];
  note: { icon: Icon; text: string };
  actionLabel: string;
  /** Asks the system for the permission; a denial resolves too, and the tour moves on. */
  onAction: () => Promise<unknown>;
  failedEvent: FrontendEvent;
  /** Leaves the page after the action or "Not now"; the tour has already moved to the next step. */
  onDone: () => void;
}

// A tour step that's a full page rather than a card, because it ends in the system's permission prompt.
export function PermissionStep(props: PermissionStepProps) {
  const theme = useTheme();
  const router = useRouter();
  const { next, finish } = useOnboardingStore();
  useTourBackLock(true);
  const goBack = useTourBack();
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepIndex = ONBOARDING_STEPS.indexOf(props.step);

  function moveOn() {
    next();
    props.onDone();
  }

  async function handleAction() {
    setError(null);
    setIsAsking(true);
    try {
      await props.onAction();
      moveOn();
    } catch (err) {
      logFailedUi(props.failedEvent, err);
      setError(describeError(err));
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-6 pt-4">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="type-label uppercase text-text-secondary">
                Step {stepIndex + 1} of {ONBOARDING_STEPS.length} · {props.stepLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skip tour"
                onPress={() => {
                  finish();
                  router.back();
                }}
                hitSlop={12}
                className="active:opacity-70">
                <Text className="type-body-medium text-text-secondary">Skip tour</Text>
              </Pressable>
            </View>
            <View className="flex-row gap-1">
              {ONBOARDING_STEPS.map((name, i) => (
                <View key={name} className={`h-1 flex-1 rounded-full bg-action-primary ${i > stepIndex ? 'opacity-25' : ''}`} />
              ))}
            </View>
          </View>

          <View className="items-center self-center">
            {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
            <SymbolView name={props.icon} tintColor={theme.actionPrimary} size={72} />
          </View>

          <View className="gap-3">
            <Text className="type-h2 text-center text-action-primary">{props.title}</Text>
            <Text className="type-body-large text-center text-text-secondary">{props.subtitle}</Text>
          </View>

          <View className="gap-4">
            {props.reasons.map((reason) => (
              <View key={reason.title} className="flex-row items-start gap-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-background-element">
                  <SymbolView name={reason.icon} tintColor={theme.primary} size={18} />
                </View>
                <View className="flex-1">
                  <Text className="type-subtitle-small text-text">{reason.title}</Text>
                  <Text className="type-body-medium text-text-secondary">{reason.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-auto gap-2">
            <View className="flex-row items-center justify-center gap-2">
              <SymbolView name={props.note.icon} tintColor={theme.textSecondary} size={14} />
              <Text className="type-caption text-text-secondary">{props.note.text}</Text>
            </View>
            {error && <Text className="type-body-medium text-center text-error">{error}</Text>}
            <Button label={props.actionLabel} size="large" loading={isAsking} onPress={handleAction} />
            <Button label="Not now" variant="ghost" size="large" disabled={isAsking} onPress={moveOn} />
            {goBack && <Button label="Back" variant="ghost" size="large" disabled={isAsking} onPress={goBack} />}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
