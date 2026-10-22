import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { Shadow } from '@/constants/theme';
import { EditPostDialog } from '@/features/feed/components/edit-post-dialog';
import { PostComments } from '@/features/feed/components/post-comments';
import { noteColor, noteTilt } from '@/features/feed/note-colors';
import { usePost } from '@/features/feed/use-post';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { useTheme } from '@/hooks/use-theme';
import type { Post } from '@/lib/post/types';

const KINDS: Record<Post['type'], string> = { new_plant: 'New plant', new_photo: 'New photo', question: 'Question' };

/**
 * A post's own page, opened from it on the feed or the profile: who posted it, when, and the
 * post itself, big, with its comments below. The pencil (only on the user's own posts) edits or deletes it.
 */
export function PostScreen({ postId }: { postId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { post: loaded, comments, addLocalComment, error, isLoading, retry } = usePost(postId);
  // The saved version, so an edit shows without loading the page again.
  const [edited, setEdited] = useState<Post | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const post = edited ?? loaded;
  // Only the user and their friends can open a post; null friendship means it's the user's own.
  const isOwn = post?.author.friendship === null;

  function leave() {
    // Nothing underneath when the app was opened straight onto this page, so go to the feed.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        // iOS needs padding to lift the comment box above the keyboard; Android resizes the
        // window itself, so shrinking the height is enough there.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
          <AppHeader
            showBack
            right={
              isOwn && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit post"
                  onPress={() => setIsEditing(true)}
                  className="h-10 w-10 items-center justify-center active:opacity-70">
                  {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                  <SymbolView
                    name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                    tintColor={theme.actionPrimary}
                    size={22}
                  />
                </Pressable>
              )
            }
          />

          <ScrollView
            contentContainerClassName="w-full max-w-content grow gap-4 self-center p-6"
            keyboardShouldPersistTaps="handled">
            {isLoading ? (
              // A colour prop, so it reads the theme instead of a class.
              <ActivityIndicator accessibilityLabel="Loading post" color={theme.primary} className="mt-6" />
            ) : error ? (
              <View className="items-center gap-3">
                <Text className="type-body-medium text-error">{error}</Text>
                <Button label="Try again" variant="secondary" onPress={retry} />
              </View>
            ) : (
              post && (
                <>
                  <PostContent post={post} isOwn={isOwn} />
                  <PostComments postId={post.id} comments={comments} onAdded={addLocalComment} />
                </>
              )
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {isEditing && post && (
        <EditPostDialog
          post={post}
          onClose={() => setIsEditing(false)}
          onSaved={(saved) => {
            setEdited(saved);
            setIsEditing(false);
          }}
          onDeleted={leave}
        />
      )}
    </View>
  );
}

function PostContent({ post, isOwn }: { post: Post; isOwn: boolean }) {
  const router = useRouter();
  const date = new Date(post.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* A friend's picture and name open their profile; the user's own lead nowhere. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isOwn ? 'You' : `Open ${post.author.username}'s profile`}
        disabled={isOwn}
        onPress={() => router.push({ pathname: '/user/[id]', params: { id: post.author.id } })}
        className="flex-row items-center gap-3 active:opacity-70">
        <UserAvatar
          size={40}
          url={post.author.avatarUrl}
          accessibilityLabel={isOwn ? 'Your profile picture' : `${post.author.username}'s profile picture`}
        />
        <View className="flex-1">
          <Text className="type-subtitle-small text-text">{isOwn ? 'You' : post.author.username}</Text>
          <Text className="type-caption text-text-secondary">
            {KINDS[post.type]} · {date}
          </Text>
        </View>
      </Pressable>

      {post.type === 'question' ? (
        // The question on its sticky note, tilted and taped as on the feed, but full size. The tilt
        // is per note, so it goes through style; the shadow sets both iOS shadow* and Android elevation.
        <View
          className={`mt-2 gap-3 rounded-sm p-4 ${noteColor(post.id)}`}
          style={[Shadow.card, { transform: [{ rotate: `${noteTilt(post.id)}deg` }] }]}>
          <View className="absolute -top-3 h-6 w-20 self-center bg-background-element opacity-70" />
          <Text accessibilityRole="header" className="type-body-large text-text">
            {post.body}
          </Text>
          {post.photoUrl && (
            <PlantPhoto
              photoUrl={post.photoUrl}
              accessibilityLabel={`Photo with the question: ${post.body}`}
              className="aspect-square w-full rounded-sm"
              iconSize={32}
            />
          )}
        </View>
      ) : (
        <>
          <PlantPhoto
            photoUrl={post.photoUrl}
            accessibilityLabel={`Photo of ${post.plantName}`}
            className="aspect-square w-full rounded-2xl"
            iconSize={48}
          />
          <Text accessibilityRole="header" className="type-h4 text-text">
            {post.plantName}
          </Text>
          {post.body && <Text className="type-body-large text-text">{post.body}</Text>}
        </>
      )}
    </>
  );
}
