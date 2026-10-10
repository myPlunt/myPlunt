import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useRecentPhotos, type LibraryPhoto } from '@/features/photos/use-recent-photos';
import { useTheme } from '@/hooks/use-theme';

// Two full rows of three: the camera tile, then the five newest photos.
const RECENT_COUNT = 5;

interface PhotoMenuProps {
  visible: boolean;
  onClose: () => void;
  /** Called once the menu is fully gone, which iOS needs before it can present a picker. */
  onDismiss: () => void;
  onTakePhoto: () => void;
  onSeeAllPhotos: () => void;
  onPickRecent: (photo: LibraryPhoto) => void;
}

/**
 * Popup for adding a photo, like a camera roll: a dark camera tile first, then the
 * user's most recent photos, and the system picker for anything older. Without library
 * access (refused, or Expo Go on Android) it still offers the camera and the picker.
 */
export function PhotoMenu({ visible, onClose, onDismiss, onTakePhoto, onSeeAllPhotos, onPickRecent }: PhotoMenuProps) {
  const theme = useTheme();
  const recent = useRecentPhotos(visible, RECENT_COUNT);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onDismiss={onDismiss}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="absolute inset-0 bg-text opacity-40"
        />
        {/* Shadow tokens set both iOS shadow* and Android elevation. */}
        <View className="w-full max-w-[360px] gap-3 rounded-2xl bg-background-element p-4" style={Shadow.card}>
          <Text className="type-subtitle-small text-text">Add a photo</Text>

          <View className="-m-0.5 flex-row flex-wrap">
            <Tile>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
                onPress={onTakePhoto}
                className="flex-1 items-center justify-center rounded-md bg-text active:opacity-70">
                {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                <SymbolView
                  name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                  tintColor={theme.backgroundElement}
                  size={28}
                />
              </Pressable>
            </Tile>
            {recent.status === 'loading' && (
              <Tile>
                <View className="flex-1 items-center justify-center">
                  {/* A colour prop, so it reads the theme instead of a class. */}
                  <ActivityIndicator accessibilityLabel="Loading recent photos" color={theme.primary} />
                </View>
              </Tile>
            )}
            {recent.status === 'ready' &&
              recent.photos.map((item, index) => (
                <Tile key={item.id}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Recent photo ${index + 1}`}
                    onPress={() => onPickRecent(item)}
                    className="flex-1 overflow-hidden rounded-md active:opacity-70">
                    <Image source={{ uri: item.uri }} className="h-full w-full" contentFit="cover" />
                  </Pressable>
                </Tile>
              ))}
          </View>
          {recent.status === 'unavailable' && (
            <Text className="type-caption text-text-secondary">
              Allow photo access in your phone settings to see your recent photos here.
            </Text>
          )}

          <View className="h-px bg-input-border" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all photos"
            onPress={onSeeAllPhotos}
            className="flex-row items-center gap-3 py-1 active:opacity-70">
            {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
            <SymbolView
              name={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' }}
              tintColor={theme.primary}
              size={22}
            />
            <Text className="type-body-large text-text">See all photos</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            className="items-center py-2 active:opacity-70">
            <Text className="type-body-medium text-text-secondary">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** One square cell of the 3-column grid. */
function Tile({ children }: { children: ReactNode }) {
  return <View className="aspect-square w-1/3 p-0.5">{children}</View>;
}
