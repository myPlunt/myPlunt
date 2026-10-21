/** Mirrors NotificationResponse (GET /v1/users/me/inbox): one notification the user was sent. */
export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  /** The app route a tap opens, as in the push notification's data.url. */
  url: string;
  createdAt: string;
}
