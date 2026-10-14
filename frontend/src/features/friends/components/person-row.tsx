import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { UserAvatar } from '@/components/user/user-avatar';
import { Shadow } from '@/constants/theme';
import type { UserSummary } from '@/lib/user/types';

interface PersonRowProps {
  user: UserSummary;
  /** A small square label after the username, e.g. "Friend". */
  tag?: string;
  onPress: () => void;
  /** Actions under the person. Outside the pressable, so screen readers reach them on their own. */
  children?: ReactNode;
}

/** A person card in the Friends screen's lists; pressing it opens their profile. */
export function PersonRow({ user, tag, onPress, children }: PersonRowProps) {
  return (
    <View className="gap-3 rounded-2xl bg-background-element p-4" style={Shadow.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={user.username}
        onPress={onPress}
        className="flex-row items-center gap-3 active:opacity-70">
        <UserAvatar size={44} url={user.avatarUrl} accessibilityLabel={`${user.username}'s profile picture`} />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="type-subtitle-small shrink text-text" numberOfLines={1}>
              {user.username}
            </Text>
            {tag && (
              <View className="rounded-md bg-primary/15 px-1.5 py-0.5">
                <Text className="type-label text-primary">{tag}</Text>
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
      {children}
    </View>
  );
}
