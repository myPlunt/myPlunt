import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { usePhotoUpload } from '@/features/photos/use-photo-upload';
import { PhotoMenu } from '@/features/plants/components/photo-menu';
import { useProfileActions } from '@/features/profile/use-profile-actions';
import { describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import type { User } from '@/lib/user/types';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 96;

/**
 * The profile picture on Edit profile. Tapping it opens the photo menu; a picked photo is
 * uploaded and saved straight away, without the form's Save button. Remove deletes it.
 */
export function AvatarField({ user }: { user: User }) {
  const theme = useTheme();
  const { updateAvatar, removeAvatar } = useProfileActions();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const photo = usePhotoUpload('AVATAR', async (key) => {
    const updated = await updateAvatar({ key });
    setAvatarUrl(updated.avatarUrl);
  });
  // The picker chosen in the menu, started once the menu is gone (see choose()).
  const pendingPick = useRef<(() => Promise<void>) | null>(null);

  // The local file while it uploads and after, so the picture doesn't flicker to the remote copy.
  const shownUrl = photo.uri ?? avatarUrl;
  const isBusy = photo.isUploading || isRemoving;

  function choose(pick: () => Promise<void>) {
    setIsMenuOpen(false);
    // iOS can't present the picker while the menu's modal is still animating away, so
    // it waits for onDismiss. Android's picker is a separate screen and opens right away.
    if (Platform.OS === 'ios') {
      pendingPick.current = pick;
    } else {
      void pick();
    }
  }

  function startPendingPick() {
    const pick = pendingPick.current;
    pendingPick.current = null;
    void pick?.();
  }

  async function handleRemove() {
    setRemoveError(null);
    setIsRemoving(true);
    try {
      await removeAvatar();
      photo.remove();
      setAvatarUrl(null);
    } catch (err) {
      logFailedUi('avatar_remove_failed_ui', err);
      setRemoveError(describeError(err));
    } finally {
      setIsRemoving(false);
    }
  }

  const error = photo.error ?? removeError;

  return (
    <View className="items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={shownUrl ? 'Change profile picture' : 'Add a profile picture'}
        disabled={isBusy}
        onPress={() => setIsMenuOpen(true)}
        className="active:opacity-70">
        <UserAvatar size={SIZE} url={shownUrl} accessibilityLabel="Your profile picture" />
        {isBusy && (
          <View className="absolute inset-0 items-center justify-center rounded-full bg-background-element opacity-70">
            {/* A colour prop, so it reads the theme instead of a class. */}
            <ActivityIndicator
              accessibilityLabel={isRemoving ? 'Removing profile picture' : 'Uploading profile picture'}
              color={theme.primary}
            />
          </View>
        )}
        <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-action-primary">
          {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
          <SymbolView
            name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
            tintColor={theme.backgroundElement}
            size={16}
          />
        </View>
      </Pressable>

      {shownUrl && !photo.isUploading && (
        <Button label="Remove picture" variant="ghost" loading={isRemoving} onPress={handleRemove} />
      )}
      {error && <Text className="type-body-medium text-center text-error">{error}</Text>}

      <PhotoMenu
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onDismiss={startPendingPick}
        onTakePhoto={() => choose(photo.takePhoto)}
        onSeeAllPhotos={() => choose(photo.chooseFromLibrary)}
        onPickRecent={(item) => {
          // No picker to present, so this one can start right away on both platforms.
          setIsMenuOpen(false);
          void photo.uploadLibraryPhoto(item);
        }}
      />
    </View>
  );
}
