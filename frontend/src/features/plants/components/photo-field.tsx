import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import { boxHeight, RULE_HEIGHT, RuledLine } from '@/features/plants/components/notebook-paper';
import { PhotoMenu } from '@/features/plants/components/photo-menu';
import type { PhotoUpload } from '@/features/photos/use-photo-upload';
import { useTheme } from '@/hooks/use-theme';

// The box spans this many ruled lines; the picked photo fills it.
const ROWS = 6;

interface PhotoFieldProps {
  photo: PhotoUpload;
  /** The photo the plant already has (when editing); a newly picked one replaces it. */
  currentPhotoUrl?: string | null;
}

/**
 * The plant's photo on the ruled grid: a label line, then a box three lines tall. Tapping
 * the empty box, or the plant's current photo, opens the photo menu (camera, recent photos,
 * all photos); once picked, the box shows the new photo while it uploads.
 */
export function PhotoField({ photo, currentPhotoUrl }: PhotoFieldProps) {
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // The picker chosen in the menu, started once the menu is gone (see choose()).
  const pendingPick = useRef<(() => Promise<void>) | null>(null);

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

  // Height comes from the grid, so it can't be a static class.
  const box = { height: boxHeight(ROWS) };

  return (
    <View>
      <RuledLine>
        <Text className="type-label text-text-secondary">Photo</Text>
      </RuledLine>
      <View className="justify-center" style={{ height: ROWS * RULE_HEIGHT }}>
        {photo.uri ? (
          <View className="overflow-hidden rounded-[10px] border-[1.5px] border-input-border" style={box}>
            <Image
              accessibilityLabel="Plant photo"
              source={{ uri: photo.uri }}
              className="h-full w-full"
              contentFit="cover"
            />
            {photo.isUploading && (
              <View className="absolute inset-0 items-center justify-center bg-background-element opacity-70">
                {/* A colour prop, so it reads the theme instead of a class. */}
                <ActivityIndicator accessibilityLabel="Uploading photo" color={theme.primary} />
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              onPress={photo.remove}
              hitSlop={8}
              className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-text opacity-80 active:opacity-60">
              {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                tintColor={theme.backgroundElement}
                size={14}
              />
            </Pressable>
          </View>
        ) : currentPhotoUrl ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change photo"
            onPress={() => setIsMenuOpen(true)}
            className="overflow-hidden rounded-[10px] border-[1.5px] border-input-border active:opacity-70"
            style={box}>
            <Image
              accessibilityLabel="Plant photo"
              source={{ uri: currentPhotoUrl }}
              className="h-full w-full"
              contentFit="cover"
            />
            <View className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-text opacity-80">
              {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
              <SymbolView
                name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                tintColor={theme.backgroundElement}
                size={14}
              />
            </View>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
            onPress={() => setIsMenuOpen(true)}
            className="items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-input-border bg-background-element active:opacity-70"
            style={box}>
            {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
            <SymbolView
              name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
              tintColor={theme.primary}
              size={24}
            />
            <Text className="type-caption text-text-secondary">Show us how it looks</Text>
          </Pressable>
        )}
      </View>
      {photo.error && (
        <RuledLine>
          <Text className="type-caption text-error" numberOfLines={1} adjustsFontSizeToFit>
            {photo.error}
          </Text>
        </RuledLine>
      )}

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
