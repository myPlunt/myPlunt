import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Children, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChip } from '@/features/plants/components/choice-chip';
import { boxHeight, oneLine, RuledLine, RuledTextField } from '@/features/plants/components/notebook-paper';
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

const planterIcon: SymbolViewProps['name'] = { ios: 'house.fill', android: 'yard', web: 'yard' };

interface AddPlantFormProps {
  /** The user's planters to pick from; null while they load. */
  planters: { id: string; name: string }[] | null;
  plantersError: string | null;
  onCreated: (plant: Plant) => void;
}

/**
 * Name, light, watering period, notes and planter for a new plant, written on ruled
 * lines. Calls onCreated with the saved plant.
 */
export function AddPlantForm({ planters, plantersError, onCreated }: AddPlantFormProps) {
  const theme = useTheme();
  const { createPlant } = usePlantActions();
  const [name, setName] = useState('');
  const [planterId, setPlanterId] = useState<string | null>(null);
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
        planterId,
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
    <View>
      <RuledTextField
        label="Name"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        placeholder="Vera the slow Monstera"
        autoCapitalize="words"
      />

      <RuledLine>
        <Text className="type-label text-text-secondary">Light</Text>
      </RuledLine>
      <ChoiceGroup>
        {lightOptions.map((option) => (
          <ChoiceChip
            key={option.value}
            label={option.label}
            icon={option.icon}
            selected={light === option.value}
            // Light is optional, so tapping the chosen option clears it again.
            onPress={() => setLight(light === option.value ? null : option.value)}
          />
        ))}
      </ChoiceGroup>
      {fieldErrors.light && <ErrorLine message={fieldErrors.light} />}

      <RuledLine>
        <Text className="type-label text-text-secondary">Watering</Text>
      </RuledLine>
      <View className="flex-row items-center gap-2" style={oneLine}>
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
          className={`type-body-large w-16 rounded-[10px] border-[1.5px] bg-background-element text-center text-text ${
            fieldErrors.wateringEveryDays ? 'border-error' : 'border-input-border'
          }`}
          // Fits inside one line with a gap to the rules (a computed size, not a class).
          style={{ height: boxHeight(1) }}
        />
        <Text className="type-body-large text-text">days</Text>
      </View>
      {fieldErrors.wateringEveryDays && <ErrorLine message={fieldErrors.wateringEveryDays} />}

      <RuledTextField
        label="Notes"
        rows={3}
        value={notes}
        onChangeText={setNotes}
        error={fieldErrors.notes}
        placeholder="Found at a flea market in Alfama…"
        maxLength={NOTES_MAX_LENGTH}
        multiline
        autoCapitalize="sentences"
        autoCorrect
      />

      <RuledLine>
        <Text className="type-label text-text-secondary">Planter</Text>
      </RuledLine>
      {plantersError ? (
        <ErrorLine message={plantersError} />
      ) : planters === null ? (
        <View className="justify-center" style={oneLine}>
          {/* A colour prop, so it reads the theme instead of a class. */}
          <ActivityIndicator accessibilityLabel="Loading planters" color={theme.primary} className="self-start" />
        </View>
      ) : planters.length === 0 ? (
        <RuledLine>
          <Text className="type-caption text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
            You have no planters yet, so it goes under Other plants.
          </Text>
        </RuledLine>
      ) : (
        <>
          <ChoiceGroup>
            {planters.map((planter) => (
              <ChoiceChip
                key={planter.id}
                label={planter.name}
                icon={planterIcon}
                selected={planterId === planter.id}
                // Optional, so tapping the chosen planter clears it again.
                onPress={() => setPlanterId(planterId === planter.id ? null : planter.id)}
              />
            ))}
          </ChoiceGroup>
          {planterId === null && (
            <RuledLine>
              <Text className="type-caption text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
                Leave empty to keep it under Other plants.
              </Text>
            </RuledLine>
          )}
        </>
      )}

      {/* Two empty lines before the button; the first shows the error, if any. */}
      <RuledLine>
        {error && (
          <Text className="type-body-medium text-error" numberOfLines={1} adjustsFontSizeToFit>
            {error}
          </Text>
        )}
      </RuledLine>
      <RuledLine />
      {/* Centred in one line. The disabled button is see-through (opacity), so the
          paper-coloured backing keeps the ruled lines from showing through it. */}
      <View className="justify-center" style={oneLine}>
        <View className="rounded-[10px] bg-background-element">
          <Button label="Add to my garden" loading={isSubmitting} disabled={name.trim() === ''} onPress={handleSubmit} />
        </View>
      </View>
    </View>
  );
}

/** Chips that wrap onto as many whole lines as they need, each centred on its line. */
function ChoiceGroup({ children }: { children: ReactNode }) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-x-2">
      {Children.map(children, (child) => (
        <View className="justify-center" style={oneLine}>
          {child}
        </View>
      ))}
    </View>
  );
}

/** A field error on a line of its own, so the rows below move down by exactly one line. */
function ErrorLine({ message }: { message: string }) {
  return (
    <RuledLine>
      <Text className="type-caption text-error" numberOfLines={1} adjustsFontSizeToFit>
        {message}
      </Text>
    </RuledLine>
  );
}
