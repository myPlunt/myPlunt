import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { useGarden } from '@/features/garden/use-garden';
import { FeedPlantCard } from '@/features/feed/components/feed-plant-card';
import { StickyNote } from '@/features/feed/components/sticky-note';
import { getMyPosts } from '@/features/feed/feed-service';
import { useFeed } from '@/features/feed/use-feed';
import { useUnreadCount } from '@/features/notifications/use-unread-count';
import { OnboardingCard } from '@/features/onboarding/components/onboarding-card';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { PostFilter, type PostFilterValue } from '@/features/profile/components/post-filter';
import { ProfileMenu, ProfileMenuButton } from '@/features/profile/components/profile-menu';
import { ProfileStats } from '@/features/profile/components/profile-stats';
import { profileStats } from '@/features/profile/profile-stats';
import { useProfile } from '@/features/profile/use-profile';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';
import { useOnboardingStore } from '@/stores/onboarding-store';

export function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, error, isLoading, retry, refresh: refreshProfile } = useProfile();
  // Only for the stats; if any of them fails, the numbers just show a dash.
  const { garden, refresh: refreshGarden } = useGarden();
  const { discovered, refresh: refreshDiscovered } = useDiscoveredSpecies();
  const { species } = useSpecies();
  const stats = garden && discovered && species ? profileStats(garden, discovered, species) : null;
  const posts = useFeed(getMyPosts);
  const [filter, setFilter] = useState<PostFilterValue>('all');
  const shown = posts.posts?.filter((post) => filter === 'all' || post.type === filter) ?? [];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { count: unreadCount, refresh: refreshUnread } = useUnreadCount();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { step } = useOnboardingStore();
  const isBioStep = step === 'bio' && !!user;
  const isFriendsStep = step === 'friends' && !!user;
  const isTourStep = isBioStep || isFriendsStep;
  useTourBackLock(isTourStep);
  const [headerTop, setHeaderTop] = useState(0);
  const [burgerBottom, setBurgerBottom] = useState(0);

  function refresh() {
    setIsRefreshing(true);
    Promise.all([refreshProfile(), posts.refresh(), refreshGarden(), refreshDiscovered(), refreshUnread()]).finally(() =>
      setIsRefreshing(false),
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {/* y counts the safe-area padding above the header; the menu is positioned from the same edge. */}
        <View onLayout={({ nativeEvent: { layout } }) => setHeaderTop(layout.y)}>
          <AppHeader
            right={
              <ProfileMenuButton
                open={isMenuOpen}
                unreadCount={unreadCount}
                onPress={() => setIsMenuOpen((open) => !open)}
                onLayout={({ nativeEvent: { layout } }) => setBurgerBottom(layout.y + layout.height)}
              />
            }
          />
        </View>

        <ScrollView
          contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.backgroundElement}
            />
          }>
          <View className="items-center gap-1">
            <View>
              <UserAvatar size={96} url={user?.avatarUrl} accessibilityLabel="Your profile picture" />
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
                  <View className="mt-4 flex-row items-center gap-3">
                    <Button label="My garden" disabled={isTourStep} onPress={() => router.push('/garden')} />
                    <View className={`rounded-2xl border-2 p-1 ${isBioStep ? 'border-primary' : 'border-transparent'}`}>
                      <Button label="Edit profile" variant="subtle" onPress={() => router.push('/edit-profile')} />
                    </View>
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

          {user && (
            <View className="gap-3">
              <Text className="type-h5 text-text">Your posts</Text>
              {posts.isLoading ? (
                <ActivityIndicator accessibilityLabel="Loading your posts" color={theme.primary} />
              ) : posts.error ? (
                <View className="items-start gap-3">
                  <Text className="type-body-medium text-error">{posts.error}</Text>
                  <Button label="Try again" variant="secondary" onPress={posts.retry} />
                </View>
              ) : posts.posts?.length ? (
                <>
                  <PostFilter value={filter} onChange={setFilter} />
                  {shown.length ? (
                    // Padding, not gap, which would push the third cell onto the next row; -m-1.5 undoes the outer edge.
                    <View className="-m-1.5 flex-row flex-wrap" pointerEvents={isTourStep ? 'none' : 'auto'}>
                      {shown.map((post) => (
                        <View key={post.id} className="w-1/3 p-1.5">
                          {post.type === 'question' ? <StickyNote post={post} hideAuthor /> : <FeedPlantCard post={post} hideAuthor />}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="type-body-medium text-text-secondary">Nothing of this kind yet.</Text>
                  )}
                </>
              ) : (
                <Text className="type-body-medium text-text-secondary">
                  You haven&apos;t shared anything yet.
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {isBioStep && (
          <View className="absolute inset-x-3 bottom-3">
            <OnboardingCard
              step="bio"
              title="Tell people about you"
              body="Add a short bio so friends know who's behind the plants. You write it in Edit profile."
              actionLabel="Add a bio"
              onAction={() => router.push('/edit-profile')}
              onSkip={() => router.push('/edit-profile')}
            />
          </View>
        )}

        {isFriendsStep && (
          <View className="absolute inset-x-3 bottom-3">
            {/* The card's own button opens the friends page: testers never spotted the menu icon. */}
            <OnboardingCard
              step="friends"
              title="Find your friends"
              body="Search for people by their username and add them. Their plants show up in your feed. You can always find friends again in the menu up top."
              actionLabel="Find friends"
              onAction={() => router.push('/friends')}
              onSkip={() => router.navigate('/garden')}
            />
          </View>
        )}

        <ProfileMenu
          open={isMenuOpen || isFriendsStep}
          top={headerTop + burgerBottom}
          onClose={() => setIsMenuOpen(false)}
          tourHref={isFriendsStep ? '/friends' : isBioStep ? null : undefined}
          unreadCount={unreadCount}
        />
      </SafeAreaView>
    </View>
  );
}
