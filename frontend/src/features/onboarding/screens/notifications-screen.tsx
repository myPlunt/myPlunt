import { useRouter } from 'expo-router';

import { PermissionStep } from '@/features/onboarding/components/permission-step';
import { requestNotificationPermission } from '@/lib/notification-permission';

export function NotificationsScreen() {
  const router = useRouter();

  return (
    <PermissionStep
      step="notifications"
      stepLabel="Notifications"
      icon={{ ios: 'bell.badge.fill', android: 'notifications_active', web: 'notifications_active' }}
      title="Never miss a watering"
      subtitle="Let myPlunt tell you when your plants need you."
      reasons={[
        {
          icon: { ios: 'drop.fill', android: 'water_drop', web: 'water_drop' },
          title: 'Water reminders',
          body: 'A nudge when a plant is thirsty.',
        },
        {
          icon: { ios: 'person.2.fill', android: 'group', web: 'group' },
          title: 'Friends and plant sitting',
          body: 'Hear when friends need a hand with their plants.',
        },
      ]}
      note={{
        icon: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
        text: 'Choose which ones you get in Settings.',
      }}
      actionLabel="Turn on notifications"
      onAction={requestNotificationPermission}
      failedEvent="notification_permission_failed_ui"
      onDone={() => router.back()}
    />
  );
}
