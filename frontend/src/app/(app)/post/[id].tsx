import { useLocalSearchParams } from 'expo-router';

import { PostScreen } from '@/features/feed/screens/post-screen';

export default function Post() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PostScreen postId={id} />;
}
