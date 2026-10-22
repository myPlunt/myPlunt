import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { Shadow } from '@/constants/theme';
import { DropBurst } from '@/features/feed/components/drop-burst';
import { EditPostDialog } from '@/features/feed/components/edit-post-dialog';
import { PostComments } from '@/features/feed/components/post-comments';
import { useWaterDrop, WaterDropView } from '@/features/feed/components/water-drop';
import { noteColor, noteTilt } from '@/features/feed/note-colors';
import { usePost } from '@/features/feed/use-post';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { ProfileMenu, ProfileMenuButton, type MenuItem } from '@/features/profile/components/profile-menu';
import { useKeepFocusedInputVisible } from '@/hooks/use-keep-focused-input-visible';
import { useTheme } from '@/hooks/use-theme';
import { logAction } from '@/lib/logger';
import type { Post } from '@/lib/post/types';

const KINDS: Record<Post['type'], string> = { new_plant: 'New plant', new_photo: 'New photo', question: 'Question' };
const DOUBLE_TAP_MS = 300;

export function PostScreen({ postId }: { postId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { post: loaded, comments, addLocalComment, error, isLoading, isRefreshing, refresh, retry } = usePost(postId);
  // The saved version, so an edit shows without loading the page again.
  const [edited, setEdited] = useState<Post | null>(null);
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerTop, setHeaderTop] = useState(0);
  const [burgerBottom, setBurgerBottom] = useState(0);
  const post = edited ?? loaded;
  const scrollRef = useKeepFocusedInputVisible();
  const isOwn = post?.author.friendship === null;
  const deleteItem: MenuItem = {
    label: 'Delete post',
    icon: { ios: 'trash', android: 'delete', web: 'delete' },
    destructive: true,
    onPress: () => {
      logAction('post_delete_started', { context: { post_id: postId } });
      setDialog('delete');
    },
  };
  // A new plant post has no words of its own, so all there is to do is delete it.
  const menuItems: MenuItem[] =
    post?.type === 'new_plant'
      ? [deleteItem]
      : [{ label: 'Edit post', icon: { ios: 'pencil', android: 'edit', web: 'edit' }, onPress: () => setDialog('edit') }, deleteItem];

  function leave() {
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
          {/* y counts the safe-area padding above the header; the menu is positioned from the same edge. */}
          <View onLayout={({ nativeEvent: { layout } }) => setHeaderTop(layout.y)}>
            <AppHeader
              showBack
              right={
                isOwn && (
                  <ProfileMenuButton
                    open={isMenuOpen}
                    onPress={() => setIsMenuOpen((open) => !open)}
                    onLayout={({ nativeEvent: { layout } }) => setBurgerBottom(layout.y + layout.height)}
                  />
                )
              }
            />
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerClassName="w-full max-w-content grow gap-4 self-center p-6"
            // Swiping the page or tapping blank space closes the keyboard.
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  // The reloaded post replaces an edit saved here.
                  setEdited(null);
                  refresh();
                }}
                tintColor={theme.primary}
                colors={[theme.primary]}
                progressBackgroundColor={theme.backgroundElement}
              />
            }>
            {isLoading ? (
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

          {/* Last child, so it draws above the page on both platforms. */}
          {isOwn && (
            <ProfileMenu
              open={isMenuOpen}
              top={headerTop + burgerBottom}
              onClose={() => setIsMenuOpen(false)}
              items={menuItems}
            />
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>

      {dialog && post && (
        <EditPostDialog
          post={post}
          mode={dialog}
          onClose={() => setDialog(null)}
          onSaved={(saved) => {
            setEdited(saved);
            setDialog(null);
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
  const drop = useWaterDrop(post);
  const lastTap = useRef(0);
  // Counts double-taps, so each one remounts the big drop and plays it again; 0 hides it.
  const [burst, setBurst] = useState(0);

  function tapToWater() {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      drop.water();
      setBurst((current) => current + 1);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  return (
    <>
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
        <>
          {/* The whole note takes the double-tap, as a question may have no photo. Not a button to screen
              readers: the drop pill is the accessible way to water. */}
          <Pressable accessible={false} disabled={!drop.canWater} onPress={tapToWater}>
            <View
              className={`mt-2 gap-3 rounded-sm p-4 ${noteColor(post.id)}`}
              style={[Shadow.card, { transform: [{ rotate: `${noteTilt(post.id)}deg` }] }]}>
              <View className="absolute -top-3 h-6 w-20 self-center bg-background-element opacity-70" />
              <Text accessibilityRole="header" className="type-body-large text-text">
                {post.body}
              </Text>
              {post.photoUrl ? (
                <View>
                  <PlantPhoto
                    photoUrl={post.photoUrl}
                    accessibilityLabel={`Photo with the question: ${post.body}`}
                    className="aspect-square w-full rounded-sm"
                    iconSize={32}
                  />
                  <View className="absolute bottom-3 left-3">
                    <WaterDropView drop={drop} pill />
                  </View>
                </View>
              ) : (
                <View className="flex-row">
                  <WaterDropView drop={drop} pill />
                </View>
              )}
              {burst > 0 && <DropBurst key={burst} onDone={() => setBurst(0)} />}
            </View>
          </Pressable>
        </>
      ) : (
        <>
          <View>
            {/* Not a button to screen readers: the drop pill is the accessible way to water. */}
            <Pressable accessible={false} disabled={!drop.canWater} onPress={tapToWater}>
              <PlantPhoto
                photoUrl={post.photoUrl}
                accessibilityLabel={`Photo of ${post.plantName}`}
                className="aspect-square w-full rounded-2xl"
                iconSize={48}
              />
              {burst > 0 && <DropBurst key={burst} onDone={() => setBurst(0)} />}
            </Pressable>
            <View className="absolute bottom-3 left-3">
              <WaterDropView drop={drop} pill />
            </View>
          </View>
          <Text accessibilityRole="header" className="type-h4 text-text">
            {post.plantName}
          </Text>
          {post.body && <Text className="type-body-large text-text">{post.body}</Text>}
        </>
      )}
    </>
  );
}
