import Constants from 'expo-constants';
import { Text, View } from 'react-native';

const isStaging = Constants.expoConfig?.extra?.appVariant === 'staging';

// Shown next to the logo so testers can tell the staging app from production.
// Renders nothing outside the staging build.
export function StagingPill() {
  if (!isStaging) {
    return null;
  }
  return (
    <View className="rounded-full bg-staging px-2 py-0.5">
      <Text className="type-label text-text">STAGING</Text>
    </View>
  );
}
