import { useLocalSearchParams } from 'expo-router';

import { UserProfileScreen } from '@/features/friends/screens/user-profile-screen';

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserProfileScreen userId={id} />;
}
