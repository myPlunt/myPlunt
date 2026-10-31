import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Shadow } from '@/constants/theme';
import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logAction, logFailedUi } from '@/lib/logger';

interface EditPlanterDialogProps {
  planter: { id: string; name: string; plantCount: number };
  onClose: () => void;
  onChanged: () => void;
}

/** Rename and delete share one modal: a second Modal opened on top of another doesn't show on iOS. */
export function EditPlanterDialog({ planter, onClose, onChanged }: EditPlanterDialogProps) {
  const { renamePlanter, deletePlanter } = usePlanterActions();
  const [name, setName] = useState(planter.name);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const canSave = trimmed !== '' && trimmed !== planter.name;

  function close() {
    if (!isBusy) onClose();
  }

  function showError(err: unknown, field?: boolean) {
    if (err instanceof ApiError && err.status === 401) return;
    const fieldError = err instanceof ApiError ? err.fieldErrors?.name : undefined;
    if (field && fieldError) {
      setNameError(fieldError);
    } else {
      setError(describeError(err));
    }
  }

  async function save() {
    setNameError(null);
    setError(null);
    setIsBusy(true);
    try {
      await renamePlanter(planter.id, { name: trimmed });
      onChanged();
    } catch (err) {
      logFailedUi('planter_rename_failed_ui', err, { planter_id: planter.id });
      showError(err, true);
      setIsBusy(false);
    }
  }

  async function confirmDelete() {
    setError(null);
    setIsBusy(true);
    try {
      await deletePlanter(planter.id);
      onChanged();
    } catch (err) {
      logFailedUi('planter_delete_failed_ui', err, { planter_id: planter.id });
      showError(err);
      setIsBusy(false);
    }
  }

  const plantsLine =
    planter.plantCount === 0
      ? "There are no plants in it. This can't be undone."
      : `Its ${planter.plantCount === 1 ? 'plant moves' : `${planter.plantCount} plants move`} to Other plants; no plants are deleted. This can't be undone.`;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        // style, not className: a flex-1 class overrides the height Android's "height" behavior sets.
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
            className="absolute inset-0 bg-text opacity-40"
          />
          <View className="w-full max-w-[360px] gap-3 rounded-2xl bg-background-element p-5" style={Shadow.card}>
            {isConfirmingDelete ? (
              <>
                <Text accessibilityRole="header" className="type-subtitle-large text-text">
                  Delete {planter.name}?
                </Text>
                <Text className="type-body-medium text-text-secondary">{plantsLine}</Text>
                {error && <Text className="type-body-medium text-error">{error}</Text>}
                <View className="mt-2 flex-row justify-center gap-3">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    disabled={isBusy}
                    style={{ borderWidth: 0 }}
                    onPress={() => {
                      logAction('planter_delete_cancelled', { context: { planter_id: planter.id } });
                      setIsConfirmingDelete(false);
                      setError(null);
                    }}
                  />
                  <Button label="Delete" variant="destructive" loading={isBusy} onPress={confirmDelete} />
                </View>
              </>
            ) : (
              <>
                <Text accessibilityRole="header" className="type-subtitle-large text-text">
                  Edit planter
                </Text>
                <FormField
                  label="Planter name"
                  value={name}
                  onChangeText={setName}
                  error={nameError ?? undefined}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={() => canSave && save()}
                />
                {error && <Text className="type-body-medium text-error">{error}</Text>}
                <View className="flex-row justify-center gap-3">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    disabled={isBusy}
                    onPress={close}
                    style={{ borderWidth: 0 }}
                  />
                  <Button label="Save" loading={isBusy} disabled={!canSave} onPress={save} />
                </View>
                <View className="h-px bg-input-border" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete planter"
                  disabled={isBusy}
                  onPress={() => {
                    logAction('planter_delete_started', { context: { planter_id: planter.id } });
                    setError(null);
                    setIsConfirmingDelete(true);
                  }}
                  className="items-center py-1 active:opacity-70">
                  <Text className="type-button-medium text-error">Delete planter</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
