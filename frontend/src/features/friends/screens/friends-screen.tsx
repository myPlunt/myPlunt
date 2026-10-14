import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { SearchField } from '@/components/ui/search-field';
import { UserAvatar } from '@/components/user/user-avatar';
import { Shadow } from '@/constants/theme';
import { useUserSearch } from '@/features/friends/use-user-search';
import { useTheme } from '@/hooks/use-theme';

// Everything social except posts: people search now; Friends and Requests tabs join it later.
export function FriendsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { users, error, isLoading } = useUserSearch(query);
  const hasResults = users !== null && users.length > 0;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-content grow gap-4 self-center px-6 pb-8 pt-2">
          <SearchField
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search people"
            placeholder="Search by username"
            autoCapitalize="none"
          />

          {query.trim() === '' ? (
            <Text className="type-body-medium text-center text-text-secondary">Find friends by their username</Text>
          ) : error ? (
            <Text className="type-body-medium text-error">{error}</Text>
          ) : hasResults ? (
            // Results of the previous query stay, dimmed, while the next one loads.
            <View className={`gap-3 ${isLoading ? 'opacity-50' : ''}`}>
              {users.map((user) => (
                // Their profile shows whether either of you asked, and lets you add them.
                <Pressable
                  key={user.id}
                  accessibilityRole="button"
                  accessibilityLabel={user.username}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: user.id } })}
                  className="flex-row items-center gap-3 rounded-2xl bg-background-element p-4 active:opacity-70"
                  style={Shadow.card}>
                  <UserAvatar size={44} url={user.avatarUrl} accessibilityLabel={`${user.username}'s profile picture`} />
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="type-subtitle-small shrink text-text" numberOfLines={1}>
                        {user.username}
                      </Text>
                      {user.friendship === 'friends' && (
                        <View className="rounded-md bg-primary/15 px-1.5 py-0.5">
                          <Text className="type-label text-primary">Friend</Text>
                        </View>
                      )}
                    </View>
                    {user.bio && (
                      <Text className="type-body-medium text-text-secondary" numberOfLines={2}>
                        {user.bio}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : isLoading ? (
            // Colour props (spinner, icons) read the theme instead of a class.
            <ActivityIndicator accessibilityLabel="Searching people" color={theme.primary} className="mt-4" />
          ) : (
            <Text className="type-body-medium text-center text-text-secondary">No one matches “{query.trim()}”</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
