import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { useGarden } from '@/features/garden/use-garden';
import { ProfileMenu, ProfileMenuButton } from '@/features/profile/components/profile-menu';
import { ProfileStats } from '@/features/profile/components/profile-stats';
import { profileStats } from '@/features/profile/profile-stats';
import { useProfile } from '@/features/profile/use-profile';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';

export function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, error, isLoading, retry } = useProfile();
  // Only for the stats; if any of them fails, the numbers just show a dash.
  const { garden } = useGarden();
  const { discovered } = useDiscoveredSpecies();
  const { species } = useSpecies();
  const stats = garden && discovered && species ? profileStats(garden, discovered, species) : null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Where the header sits and where the burger ends inside it, so the menu's icons start
  // right under the burger's box and continue the column at the same 40px step.
  const [headerTop, setHeaderTop] = useState(0);
  const [burgerBottom, setBurgerBottom] = useState(0);

  return (
    <View className="flex-1 bg-background">
      {/* No bottom edge: the tab bar below already pads for the home indicator. */}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {/* y counts the safe-area padding above the header; the menu is positioned from the
            same edge. The burger's own layout is relative to the header's row. */}
        <View onLayout={({ nativeEvent: { layout } }) => setHeaderTop(layout.y)}>
          <AppHeader
            right={
              <ProfileMenuButton
                open={isMenuOpen}
                onPress={() => setIsMenuOpen((open) => !open)}
                onLayout={({ nativeEvent: { layout } }) => setBurgerBottom(layout.y + layout.height)}
              />
            }
          />
        </View>

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6">
          <View className="items-center gap-1">
            <View>
              <UserAvatar size={96} url={user?.avatarUrl} accessibilityLabel="Your profile picture" />


              {/* TO think we need to show the streak badge here, but we don't have the streak data yet. */}
              {/* The streak sould be just increasing never decreassing we dont know how to make that happen yet. */}
              {/* {streak !== null && (
                <View className="absolute -bottom-1 -right-1">
                  <WateringStreakBadge streak={streak} />
                </View>
              )} */}
            </View>
            {isLoading ? (
              <ActivityIndicator accessibilityLabel="Loading profile" color={theme.primary} className="mt-4" />
            ) : error ? (
              <View className="items-center gap-3">
                <Text className="type-body-medium text-error">{error}</Text>
                <Button label="Try again" variant="secondary" onPress={retry} />
              </View>
            ) : (
              user && (
                <>
                  <Text className="type-h4 text-text">{user.username}</Text>
                  <Text className="type-body-medium text-text-secondary">{user.email}</Text>
                  {user.bio && <Text className="type-body-large mt-3 text-center text-text">{user.bio}</Text>}
                  <View className="mt-4 flex-row gap-3">
                    <Button label="My garden" onPress={() => router.push('/garden')} />
                    <Button label="Edit profile" variant="subtle" onPress={() => router.push('/edit-profile')} />
                  </View>
                  <View className="mt-6 self-stretch">
                    <ProfileStats
                      stats={stats}
                      onOpenGarden={() => router.push('/garden')}
                      onOpenPluntdex={() => router.push('/pluntdex')}
                    />
                  </View>
                </>
              )
            )}
          </View>
        </ScrollView>

        <ProfileMenu open={isMenuOpen} top={headerTop + burgerBottom} onClose={() => setIsMenuOpen(false)} />
      </SafeAreaView>
    </View>
  );
}
