import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { boxHeight, oneLine, singleLineInputText } from '@/features/plants/components/notebook-paper';
import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Planter } from '@/lib/planter/types';

// Without a planter the plant goes in the garden's group without a room.
const NO_PLANTER_LABEL = 'Other plants';

interface PlanterSelectProps {
  planters: Planter[];
  selectedId: string | null;
  onSelect: (planterId: string | null) => void;
  /** Called with a planter the user just created here; it's already saved. */
  onAdded: (planter: Planter) => void;
}

/**
 * A dropdown on one ruled line: shows the chosen planter and opens a list of the user's
 * planters, "Other plants" (no planter) and a way to add a new one. Our own modal
 * instead of a native picker, so it looks the same on both platforms.
 */
export function PlanterSelect({ planters, selectedId, onSelect, onAdded }: PlanterSelectProps) {
  const theme = useTheme();
  const { createPlanter } = usePlanterActions();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selected = planters.find((planter) => planter.id === selectedId) ?? null;

  function close() {
    setIsOpen(false);
    setIsAdding(false);
    setNewName('');
    setAddError(null);
  }

  function choose(planterId: string | null) {
    onSelect(planterId);
    close();
  }

  async function add() {
    setAddError(null);
    setIsSaving(true);
    try {
      const planter = await createPlanter({ name: newName });
      onAdded(planter);
      choose(planter.id);
    } catch (err) {
      setAddError(err instanceof ApiError && err.fieldErrors?.name ? err.fieldErrors.name : describeError(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View className="justify-center" style={oneLine}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Planter"
        accessibilityValue={{ text: selected?.name ?? NO_PLANTER_LABEL }}
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between rounded-[10px] border-[1.5px] border-input-border bg-background-element px-4 active:opacity-70"
        // Height comes from the ruled grid, so it can't be a static class.
        style={{ height: boxHeight(1) }}>
        <Text className={`type-body-large ${selected ? 'text-text' : 'text-text-secondary'}`} numberOfLines={1}>
          {selected?.name ?? NO_PLANTER_LABEL}
        </Text>
        {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
        <SymbolView
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          tintColor={theme.textSecondary}
          size={16}
        />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
            className="absolute inset-0 bg-text opacity-40"
          />
          {/* Shadow tokens set both iOS shadow* and Android elevation. */}
          <View
            className="max-h-[70%] w-full max-w-[360px] gap-2 rounded-2xl bg-background-element p-4"
            style={Shadow.card}>
            <Text className="type-subtitle-small text-text">Choose a planter</Text>
            <ScrollView accessibilityRole="radiogroup" className="grow-0">
              {[{ id: null, name: NO_PLANTER_LABEL }, ...planters].map((option) => (
                <Pressable
                  key={option.id ?? 'none'}
                  accessibilityRole="radio"
                  accessibilityLabel={option.name}
                  accessibilityState={{ checked: option.id === selectedId }}
                  onPress={() => choose(option.id)}
                  className="flex-row items-center justify-between py-3 active:opacity-70">
                  <Text
                    className={`type-body-large ${option.id === null ? 'text-text-secondary' : 'text-text'}`}
                    numberOfLines={1}>
                    {option.name}
                  </Text>
                  {option.id === selectedId && (
                    // tintColor is a colour prop, so it reads the theme instead of a class.
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      tintColor={theme.primary}
                      size={16}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <View className="h-px bg-input-border" />

            {isAdding ? (
              <View className="gap-2 pt-1">
                <TextInput
                  accessibilityLabel="New planter name"
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. Kitchen windowsill"
                  // A colour prop, not a style, so it can't take a class.
                  placeholderTextColor={theme.placeholder}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={() => newName.trim() !== '' && add()}
                  className={`rounded-[10px] border-[1.5px] bg-background-element px-4 text-text ${
                    addError ? 'border-error' : 'border-input-border'
                  }`}
                  style={[{ height: boxHeight(1) }, singleLineInputText]}
                />
                {addError && <Text className="type-caption text-error">{addError}</Text>}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      label="Cancel"
                      variant="secondary"
                      onPress={() => {
                        setIsAdding(false);
                        setNewName('');
                        setAddError(null);
                      }}
                      style={{ borderWidth: 0 }}
                    />
                  </View>
                  <View className="flex-1">
                    <Button label="Add" loading={isSaving} disabled={newName.trim() === ''} onPress={add} />
                  </View>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a planter"
                onPress={() => setIsAdding(true)}
                className="flex-row items-center gap-3 py-2 active:opacity-70">
                {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                <SymbolView
                  name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                  tintColor={theme.primary}
                  size={22}
                />
                <Text className="type-body-large text-primary">Add a planter</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
