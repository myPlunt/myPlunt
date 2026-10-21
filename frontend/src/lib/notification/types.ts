/** Mirrors NotificationResponse (GET /v1/users/me/inbox): one notification the user was sent. */
export interface InboxNotification {
  id: string;
  /** Who it's from, e.g. who sent a friend request; null for the app's own, like watering reminders. */
  fromUserId: string | null;
  /** The sender's profile picture; null when they have none (or it's the app's own). */
  fromAvatarUrl: string | null;
  title: string;
  body: string;
  /** The app route a tap opens, as in the push notification's data.url. */
  url: string;
  createdAt: string;
}
