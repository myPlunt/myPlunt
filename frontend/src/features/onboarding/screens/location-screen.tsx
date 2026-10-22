import { useRouter } from 'expo-router';

import { PermissionStep } from '@/features/onboarding/components/permission-step';

import { shareLocation } from '../location-service';

export function LocationScreen() {
  const router = useRouter();

  return (
    <PermissionStep
      step="location"
      stepLabel="Your city"
      icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
      title="Where do your plants live?"
      subtitle="Share your city once and we'll keep an eye on the weather for you."
      reasons={[
        {
          icon: { ios: 'snowflake', android: 'ac_unit', web: 'ac_unit' },
          title: 'Frost and heat alerts',
          body: 'Know when to bring plants in or water extra.',
        },
        {
          icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
          title: 'An app that matches your sky',
          body: "myPlunt's look follows the weather outside.",
        },
      ]}
      note={{ icon: { ios: 'lock.fill', android: 'lock', web: 'lock' }, text: 'We save your city, never your exact location.' }}
      actionLabel="Share my city"
      onAction={shareLocation}
      failedEvent="location_share_failed_ui"
      onDone={() => router.replace('/notifications')}
    />
  );
}
