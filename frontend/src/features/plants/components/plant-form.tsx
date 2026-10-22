import { SymbolView } from 'expo-symbols';
import { Children, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { usePhotoUpload } from '@/features/photos/use-photo-upload';
import { ChoiceChip } from '@/features/plants/components/choice-chip';
import {
  AnimatedLines,
  boxHeight,
  oneLine,
  RuledLine,
  RuledTextField,
  singleLineInputText,
} from '@/features/plants/components/notebook-paper';
import { PhotoField } from '@/features/plants/components/photo-field';
import { PlanterSelect } from '@/features/plants/components/planter-select';
import { ShareToFeedCheckbox } from '@/features/plants/components/share-to-feed-checkbox';
import { lightOptions } from '@/features/plants/light-options';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { matchesSpecies } from '@/features/species/matches-species';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi, logWarning } from '@/lib/logger';
import type { Light, Plant, PlantDetails } from '@/lib/plant/types';
import type { Planter } from '@/lib/planter/types';
import type { Species } from '@/lib/species/types';

const NOTES_MAX_LENGTH = 1000;
// Same as the backend's CreatePlantRequest; spaces around the name don't count.
const NAME_MIN_LENGTH = 3;

// Fields the backend may reject that live on step 1; an error there sends the user back to it.
const STEP_1_FIELDS = ['name', 'speciesId', 'photoKey'];

const MAX_SPECIES_SUGGESTIONS = 3;

interface PlantFormProps {
  plant?: PlantDetails;
  initialSpecies?: Pick<Species, 'id' | 'commonName'>;
  species: Species[] | null;
  speciesError: string | null;
  planters: Planter[] | null;
  plantersError: string | null;
  onSaved: (plant: Plant) => void;
}

export function PlantForm({
  plant,
  initialSpecies,
  species,
  speciesError,
  planters,
  plantersError,
  onSaved,
}: PlantFormProps) {
  const theme = useTheme();
  const { createPlant, updatePlant } = usePlantActions();
  const photo = usePhotoUpload('PLANT');
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(plant?.name ?? '');
  // The length hint waits until the user has left the field, so it doesn't nag while they type.
  const [hasLeftName, setHasLeftName] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [speciesQuery, setSpeciesQuery] = useState(plant?.speciesName ?? initialSpecies?.commonName ?? '');
  const [speciesId, setSpeciesId] = useState<string | null>(plant?.speciesId ?? initialSpecies?.id ?? null);
  const [isSpeciesFocused, setIsSpeciesFocused] = useState(false);
  const [planterId, setPlanterId] = useState<string | null>(plant?.planterId ?? null);
  // Planters added from the dropdown; the garden (and so `planters`) only reloads later.
  const [addedPlanters, setAddedPlanters] = useState<Planter[]>([]);
  const [light, setLight] = useState<Light | null>(plant?.light ?? null);
  // The owner's own setting only: left empty, the species' frequency keeps applying.
  const [wateringEveryDays, setWateringEveryDays] = useState(plant?.wateringEveryDays?.toString() ?? '');
  const [notes, setNotes] = useState(plant?.notes ?? '');
  // Only for a new plant: an edit isn't news for the feed.
  const [shareToFeed, setShareToFeed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allPlanters = planters && [...planters, ...addedPlanters];
  const nameLength = name.trim().length;
  const nameTooShort = hasLeftName && !isNameFocused && nameLength < NAME_MIN_LENGTH;
  const selectedSpecies = species?.find((item) => item.id === speciesId) ?? null;
  const speciesSuggestions =
    speciesQuery.trim() === '' || selectedSpecies || !species
      ? []
      : species.filter((item) => matchesSpecies(item, speciesQuery)).slice(0, MAX_SPECIES_SUGGESTIONS);
  // A search left unfinished (text but no pick) stays open after leaving the field.
  const isSearchingSpecies = !selectedSpecies && (isSpeciesFocused || speciesQuery.trim() !== '');
  const speciesRows = speciesError || selectedSpecies ? 1 : isSearchingSpecies ? MAX_SPECIES_SUGGESTIONS : 0;

  function changeSpeciesQuery(text: string) {
    setSpeciesQuery(text);
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
      const request = {
        name,
        light,
        wateringEveryDays: wateringEveryDays === '' ? null : Number(wateringEveryDays),
        notes: notes.trim() === '' ? null : notes,
        planterId,
        speciesId,
        // Without a new photo this is null, which keeps an edited plant's current photo.
        photoKey: photo.key,
      };
      onSaved(plant ? await updatePlant(plant.id, request) : await createPlant({ ...request, shareToFeed }));
    } catch (err) {
      logFailedUi('plant_save_failed_ui', err, { mode: plant ? 'edit' : 'create' });
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
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => {
              setIsNameFocused(false);
              setHasLeftName(true);
              if (nameLength < NAME_MIN_LENGTH) {
                logWarning('form_validation_failed', { context: { form: 'plant', fields: 'name' } });
              }
            }}
            error={fieldErrors.name ?? (nameTooShort ? `Name must be at least ${NAME_MIN_LENGTH} characters.` : undefined)}
            placeholder="Vera the slow Monstera"
            autoCapitalize="words"
          />

          <RuledTextField
            label="Species"
            value={speciesQuery}
            onChangeText={changeSpeciesQuery}
            onFocus={() => setIsSpeciesFocused(true)}
            onBlur={() => setIsSpeciesFocused(false)}
            placeholder="Search, e.g. Monstera"
            autoCapitalize="words"
          />
          {/* Fixed sizes, so the photo below only moves (and slides) when the search opens, closes or picks. */}
          <AnimatedLines rows={speciesRows}>
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
            ) : !isSearchingSpecies ? null : speciesQuery.trim() === '' ? (
              <RuledLine>
                <Text className="type-caption text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
                  Start typing to see matching species.
                </Text>
              </RuledLine>
            ) : species === null ? (
              <View className="justify-center" style={oneLine}>
                <ActivityIndicator accessibilityLabel="Loading species" color={theme.primary} className="self-start" />
              </View>
            ) : speciesSuggestions.length === 0 ? (
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
          </AnimatedLines>

          <PhotoField photo={photo} currentPhotoUrl={plant?.photoUrl ?? null} />
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
              tintColor={theme.water}
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
              // Left empty, the species' frequency or the backend's 7-day default applies, so hint at it.
              placeholder={String(selectedSpecies?.wateringFrequencyDays ?? 7)}
              placeholderTextColor={theme.placeholder}
              className={`w-16 rounded-[10px] border-[1.5px] bg-background-element text-center text-text ${
                fieldErrors.wateringEveryDays ? 'border-error' : 'border-input-border'
              }`}
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
          ) : allPlanters === null ? (
            <View className="justify-center" style={oneLine}>
              <ActivityIndicator accessibilityLabel="Loading planters" color={theme.primary} className="self-start" />
            </View>
          ) : (
            <PlanterSelect
              planters={allPlanters}
              selectedId={planterId}
              onSelect={setPlanterId}
              onAdded={(planter) => setAddedPlanters((current) => [...current, planter])}
            />
          )}
          {!plant && <ShareToFeedCheckbox checked={shareToFeed} onChange={setShareToFeed} />}
        </>
      )}

      <RuledLine>
        {error && (
          <Text className="type-body-medium text-error" numberOfLines={1} adjustsFontSizeToFit>
            {error}
          </Text>
        )}
      </RuledLine>
      {/* Backs the see-through disabled button, so the ruled lines don't show through it. */}
      <View className="flex-row items-center gap-3" style={oneLine}>
        {step === 1 ? (
          <View className="flex-1 rounded-[10px] bg-background-element">
            <Button
              label="Next"
              disabled={nameLength < NAME_MIN_LENGTH}
              onPress={() => setStep(2)}
              style={{ height: boxHeight(1) }}
            />
          </View>
        ) : (
          <>
            <View className="flex-1 rounded-[10px] bg-background-element">
              <Button
                label="Back"
                variant="secondary"
                onPress={() => setStep(1)}
                style={{ height: boxHeight(1), borderWidth: 0 }}
              />
            </View>
            <View className="flex-[2] rounded-[10px] bg-background-element">
              <Button
                label={plant ? 'Save changes' : 'Add to my garden'}
                loading={isSubmitting}
                // The photo has to finish uploading first, or it would be left out.
                disabled={photo.isUploading}
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
