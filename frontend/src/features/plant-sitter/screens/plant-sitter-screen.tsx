import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { PersonRow } from '@/features/friends/components/person-row';
import { useTheme } from '@/hooks/use-theme';

import { groupSitters } from '../group-sitters';
import { useSitters } from '../use-sitters';

export function PlantSitterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sitters, error, retry } = useSitters();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-8 pt-2">
          <Text accessibilityRole="header" className="type-h3 text-action-primary" style={styles.title}>
            Plant sitter
          </Text>

          <View className="flex-row items-center gap-4 rounded-3xl bg-action-primary p-5" style={Shadow.card}>
            <SymbolView name={{ ios: 'key.fill', android: 'key', web: 'key' }} tintColor={theme.snow} size={28} />
            <View className="flex-1 gap-1">
              <Text className="type-subtitle-large text-snow">Going away?</Text>
              <Text className="type-body-medium text-snow">
                Friends who live close by can look after your plants while you&apos;re gone.
              </Text>
            </View>
          </View>

          {error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : !sitters ? (
            <ActivityIndicator accessibilityLabel="Loading friends" color={theme.primary} className="mt-4" />
          ) : sitters.length === 0 ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-center text-text-secondary">
                Add friends first, then they show up here.
              </Text>
              <Button label="Find friends" variant="secondary" onPress={() => router.push('/friends')} />
            </View>
          ) : (
            groupSitters(sitters).map((group) => (
              <View key={group.title} className="gap-3">
                <Text className="type-label uppercase text-accent">{group.title}</Text>
                {group.sitters.map((sitter) => (
                  <PersonRow
                    key={sitter.user.id}
                    user={sitter.user}
                    tag={sitter.distanceKm !== null ? `${sitter.distanceKm} km` : undefined}
                    onPress={() => router.push({ pathname: '/user/[id]', params: { id: sitter.user.id } })}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lateef needs a taller line or iOS clips its glyphs. A style, as a leading-* class loses to type-h3.
  title: {
    lineHeight: 58,
    includeFontPadding: false,
  },
});
