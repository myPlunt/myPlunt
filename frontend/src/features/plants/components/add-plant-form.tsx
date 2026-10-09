import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Shadow } from '@/constants/theme';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Light, Plant } from '@/lib/plant/types';

const NOTES_MAX_LENGTH = 1000;

const lightOptions: { value: Light; label: string; icon: SymbolViewProps['name'] }[] = [
  { value: 'full_sun', label: 'Full sun', icon: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' } },
  {
    value: 'bright_indirect',
    label: 'Bright indirect',
    icon: { ios: 'sun.haze.fill', android: 'light_mode', web: 'light_mode' },
  },
  {
    value: 'partial_shade',
    label: 'Partial shade',
    icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
  },
  { value: 'low_light', label: 'Low light', icon: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' } },
];

/** Name, light, watering period and notes for a new plant. Calls onCreated with the saved plant. */
export function AddPlantForm({ onCreated }: { onCreated: (plant: Plant) => void }) {
  const theme = useTheme();
  const { createPlant } = usePlantActions();
  const [name, setName] = useState('');
  const [light, setLight] = useState<Light | null>(null);
  const [wateringEveryDays, setWateringEveryDays] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const plant = await createPlant({
        name,
        light,
        wateringEveryDays: wateringEveryDays === '' ? null : Number(wateringEveryDays),
        notes: notes.trim() === '' ? null : notes,
      });
      onCreated(plant);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setError(describeError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-1">
      <FormField
        label="Name"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        placeholder="Vera the slow Monstera"
        autoCapitalize="words"
      />

      <View className="mb-2 gap-1">
        <Text className="type-label text-text-secondary">Light</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {lightOptions.map((option) => {
            const selected = light === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: selected }}
                // Light is optional, so tapping the chosen option clears it again.
                onPress={() => setLight(selected ? null : option.value)}
                className={`flex-row items-center gap-2 rounded-full border-[1.5px] px-3 py-2 active:opacity-70 ${
                  selected ? 'border-primary bg-primary' : 'border-input-border bg-background-element'
                }`}
                style={Shadow.level2}>
                {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                <SymbolView
                  name={option.icon}
                  tintColor={selected ? theme.backgroundElement : theme.accent}
                  size={16}
                />
                <Text className={`type-body-medium ${selected ? 'text-background-element' : 'text-text'}`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {fieldErrors.light && <Text className="type-caption text-error">{fieldErrors.light}</Text>}
      </View>

      <View className="mb-2 gap-1">
        <Text className="type-label text-text-secondary">Watering</Text>
        <View className="flex-row items-center gap-2">
          <SymbolView
            name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
            tintColor={theme.primary}
            size={18}
          />
          <Text className="type-body-large text-text">Every</Text>
          <TextInput
            accessibilityLabel="Water every how many days"
            value={wateringEveryDays}
            // Digits only: the number pad still allows pasting other text.
            onChangeText={(text) => setWateringEveryDays(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="7"
            // A colour prop, not a style, so it can't take a class.
            placeholderTextColor={theme.placeholder}
            className={`type-body-large h-10 w-16 rounded-[10px] border-[1.5px] bg-background-element text-center text-text ${
              fieldErrors.wateringEveryDays ? 'border-error' : 'border-input-border'
            }`}
            style={Shadow.level2}
          />
          <Text className="type-body-large text-text">days</Text>
        </View>
        {fieldErrors.wateringEveryDays && (
          <Text className="type-caption text-error">{fieldErrors.wateringEveryDays}</Text>
        )}
      </View>

      <FormField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        error={fieldErrors.notes}
        placeholder="Found at a flea market in Alfama…"
        maxLength={NOTES_MAX_LENGTH}
        multiline
        autoCapitalize="sentences"
        autoCorrect
      />

      {error && <Text className="type-body-medium text-error">{error}</Text>}

      <View className="mt-4">
        <Button
          label="Add to my garden"
          size="large"
          loading={isSubmitting}
          disabled={name.trim() === ''}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}
