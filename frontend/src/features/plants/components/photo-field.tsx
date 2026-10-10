import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { boxHeight, RULE_HEIGHT, RuledLine } from '@/features/plants/components/notebook-paper';
import type { PhotoUpload } from '@/features/photos/use-photo-upload';
import { useTheme } from '@/hooks/use-theme';

// The box spans this many ruled lines, like the notes field.
const ROWS = 3;

/**
 * The plant's photo on the ruled grid: a label line, then a box three lines tall that
 * offers the camera and the library, or shows the picked photo while it uploads.
 * Plain buttons instead of a menu, so it looks the same on both platforms.
 */
export function PhotoField({ photo }: { photo: PhotoUpload }) {
  const theme = useTheme();
  // Height comes from the grid, so it can't be a static class.
  const box = { height: boxHeight(ROWS) };

  return (
    <View>
      <RuledLine>
        <Text className="type-label text-text-secondary">Photo</Text>
      </RuledLine>
      <View className="justify-center" style={{ height: ROWS * RULE_HEIGHT }}>
        {photo.uri ? (
          <View className="flex-row items-center gap-4" style={box}>
            <View className="overflow-hidden rounded-[10px]" style={{ width: box.height, height: box.height }}>
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
            </View>
            <View className="flex-1 gap-2">
              <Text className="type-body-medium text-text-secondary">
                {photo.isUploading ? 'Uploading…' : 'Looking good!'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                onPress={photo.remove}
                className="self-start active:opacity-70">
                <Text className="type-body-medium text-primary underline">Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View
            className="flex-row items-center rounded-[10px] border-[1.5px] border-dashed border-input-border"
            style={box}>
            <PhotoSource
              label="Take photo"
              icon={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
              onPress={photo.takePhoto}
            />
            <View className="h-3/5 w-px bg-input-border" />
            <PhotoSource
              label="Choose from library"
              icon={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' }}
              onPress={photo.chooseFromLibrary}
            />
          </View>
        )}
      </View>
      {photo.error && (
        <RuledLine>
          <Text className="type-caption text-error" numberOfLines={1} adjustsFontSizeToFit>
            {photo.error}
          </Text>
        </RuledLine>
      )}
    </View>
  );
}

function PhotoSource({ label, icon, onPress }: { label: string; icon: SymbolViewProps['name']; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-full flex-1 items-center justify-center gap-1 active:opacity-70">
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView name={icon} tintColor={theme.primary} size={24} />
      <Text className="type-caption text-text">{label}</Text>
    </Pressable>
  );
}
