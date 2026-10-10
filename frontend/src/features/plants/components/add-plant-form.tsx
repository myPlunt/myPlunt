import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Children, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChip } from '@/features/plants/components/choice-chip';
import {
  boxHeight,
  oneLine,
  RULE_HEIGHT,
  RuledLine,
  RuledTextField,
  singleLineInputText,
} from '@/features/plants/components/notebook-paper';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Light, Plant } from '@/lib/plant/types';
import type { Species } from '@/lib/species/types';

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

// Fields the backend may reject that live on step 1; an error there sends the user back to it.
const STEP_1_FIELDS = ['name', 'speciesId'];

// Suggestions shown under the species search, one per ruled line.
const MAX_SPECIES_SUGGESTIONS = 3;

function matchesSpecies(species: Species, query: string) {
  const needle = query.trim().toLowerCase();
  return species.commonName.toLowerCase().includes(needle) || species.scientificName.toLowerCase().includes(needle);
}

interface AddPlantFormProps {
  /** The approved species to search; null while they load. */
  species: Species[] | null;
  speciesError: string | null;
  /** The user's planters to pick from; null while they load. */
  planters: { id: string; name: string }[] | null;
  plantersError: string | null;
  onCreated: (plant: Plant) => void;
}

/**
 * A new plant in two steps on the ruled paper: who it is (name, species, photo), then
 * how it lives (light, watering, notes, planter). Values carry over between the steps.
 * Calls onCreated with the saved plant.
 */
export function AddPlantForm({ species, speciesError, planters, plantersError, onCreated }: AddPlantFormProps) {
  const theme = useTheme();
  const { createPlant } = usePlantActions();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [planterId, setPlanterId] = useState<string | null>(null);
  const [light, setLight] = useState<Light | null>(null);
  const [wateringEveryDays, setWateringEveryDays] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSpecies = species?.find((item) => item.id === speciesId) ?? null;
  const speciesSuggestions =
    speciesQuery.trim() === '' || selectedSpecies || !species
      ? []
      : species.filter((item) => matchesSpecies(item, speciesQuery)).slice(0, MAX_SPECIES_SUGGESTIONS);

  function changeSpeciesQuery(text: string) {
    setSpeciesQuery(text);
    // Typing again means searching again, so the earlier pick no longer applies.
    setSpeciesId(null);
  }

  function selectSpecies(item: Species) {
    setSpeciesId(item.id);
    setSpeciesQuery(item.commonName);
  }

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
        speciesId,
      });
      onCreated(plant);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
        if (Object.keys(err.fieldErrors).some((field) => STEP_1_FIELDS.includes(field))) {
          setStep(1);
        }
      } else {
        setError(describeError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View>
      {step === 1 ? (
        <>
          <RuledTextField
            label="Name"
            value={name}
            onChangeText={setName}
            error={fieldErrors.name}
            placeholder="Vera the slow Monstera"
            autoCapitalize="words"
          />

          <RuledTextField
            label="Species"
            value={speciesQuery}
            onChangeText={changeSpeciesQuery}
            placeholder="Search, e.g. Monstera"
            autoCapitalize="words"
          />
          {speciesError ? (
            <ErrorLine message={speciesError} />
          ) : selectedSpecies ? (
            <RuledLine>
              <Text className="type-caption text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
                {selectedSpecies.scientificName}
                {selectedSpecies.wateringFrequencyDays !== null &&
                  ` · usually watered every ${selectedSpecies.wateringFrequencyDays} days`}
              </Text>
            </RuledLine>
          ) : speciesQuery.trim() !== '' && species === null ? (
            <View className="justify-center" style={oneLine}>
              {/* A colour prop, so it reads the theme instead of a class. */}
              <ActivityIndicator accessibilityLabel="Loading species" color={theme.primary} className="self-start" />
            </View>
          ) : speciesQuery.trim() !== '' && speciesSuggestions.length === 0 ? (
            <RuledLine>
              <Text className="type-caption text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
                No species matches. You can leave it empty.
              </Text>
            </RuledLine>
          ) : (
            speciesSuggestions.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.commonName}
                onPress={() => selectSpecies(item)}
                className="flex-row items-end gap-2 pb-1 active:opacity-70"
                style={oneLine}>
                <Text className="type-body-medium text-text">{item.commonName}</Text>
                <Text className="type-caption shrink text-text-secondary" numberOfLines={1}>
                  {item.scientificName}
                </Text>
              </Pressable>
            ))
          )}

          <RuledLine>
            <Text className="type-label text-text-secondary">Photo</Text>
          </RuledLine>
          {/* Placeholder, not a button: uploading needs file storage on the backend
              (TMP-007), and the plant_photos table is waiting for it. */}
          <View className="justify-center" style={{ height: 3 * RULE_HEIGHT }}>
            <View
              className="items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed border-input-border"
              style={{ height: boxHeight(3) }}>
              {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
              <SymbolView
                name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
                tintColor={theme.accent}
                size={24}
              />
              <Text className="type-caption text-text-secondary">Photos are coming soon</Text>
            </View>
          </View>
        </>
      ) : (
        <>
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
              // Left empty, the garden falls back to the species' own frequency, so hint at it.
              placeholder={String(selectedSpecies?.wateringFrequencyDays ?? 7)}
              // A colour prop, not a style, so it can't take a class.
              placeholderTextColor={theme.placeholder}
              className={`w-16 rounded-[10px] border-[1.5px] bg-background-element text-center text-text ${
                fieldErrors.wateringEveryDays ? 'border-error' : 'border-input-border'
              }`}
              // Fits inside one line with a gap to the rules (a computed size, not a class),
              // with its number centred in the box.
              style={[{ height: boxHeight(1) }, singleLineInputText]}
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
        </>
      )}

      {/* Two empty lines before the buttons: the first shows the error, or else which step this is. */}
      <RuledLine>
        {error ? (
          <Text className="type-body-medium text-error" numberOfLines={1} adjustsFontSizeToFit>
            {error}
          </Text>
        ) : (
          <Text className="type-caption text-text-secondary">Step {step} of 2</Text>
        )}
      </RuledLine>
      <RuledLine />
      {/* Centred in one line with the same gap to the rules as the input boxes. A
          disabled button is see-through (opacity), so the paper-coloured backing keeps
          the ruled lines from showing through it. */}
      <View className="flex-row items-center gap-3" style={oneLine}>
        {step === 1 ? (
          <View className="flex-1 rounded-[10px] bg-background-element">
            <Button
              label="Next"
              disabled={name.trim() === ''}
              onPress={() => setStep(2)}
              style={{ height: boxHeight(1) }}
            />
          </View>
        ) : (
          <>
            <View className="flex-1 rounded-[10px] bg-background-element">
              <Button label="Back" variant="secondary" onPress={() => setStep(1)} style={{ height: boxHeight(1) }} />
            </View>
            <View className="flex-[2] rounded-[10px] bg-background-element">
              <Button
                label="Add to my garden"
                loading={isSubmitting}
                onPress={handleSubmit}
                style={{ height: boxHeight(1) }}
              />
            </View>
          </>
        )}
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
