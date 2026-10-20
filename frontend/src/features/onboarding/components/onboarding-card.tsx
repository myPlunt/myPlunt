import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { ONBOARDING_STEPS, useOnboardingStore, type TourStep } from '@/stores/onboarding-store';

interface OnboardingCardProps {
  step: TourStep;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}

// The tour's coach card. The screen places it (usually pinned to the bottom) and
// highlights the control the card talks about.
export function OnboardingCard({ step, title, body, actionLabel, onAction }: OnboardingCardProps) {
  const { next, finish } = useOnboardingStore();
  const index = ONBOARDING_STEPS.indexOf(step);

  return (
    <View className="gap-3 rounded-2xl bg-action-primary p-5" style={Shadow.card}>
      <View className="flex-row items-center justify-between">
        <Text className="type-label uppercase text-background-element">
          Step {index + 1} of {ONBOARDING_STEPS.length}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip tour"
          onPress={finish}
          hitSlop={12}
          className="active:opacity-70">
          <Text className="type-body-medium text-background-element">Skip tour</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-1">
        {ONBOARDING_STEPS.map((name, i) => (
          <View key={name} className={`h-1 flex-1 rounded-full bg-background-element ${i > index ? 'opacity-25' : ''}`} />
        ))}
      </View>

      <View className="gap-1">
        <Text className="type-h4 text-background-element">{title}</Text>
        <Text className="type-body-large text-background-element">{body}</Text>
      </View>

      <View className="flex-row items-center justify-end gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Not now"
          onPress={next}
          className="h-10 justify-center px-4 active:opacity-70">
          <Text className="type-button-medium text-background-element">Not now</Text>
        </Pressable>
        <Button label={actionLabel} variant="subtle" onPress={onAction} />
      </View>
    </View>
  );
}
