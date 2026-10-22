export interface InboxNotification {
  id: string;
  fromUserId: string | null;
  fromAvatarUrl: string | null;
  title: string;
  body: string;
  url: string;
  createdAt: string;
}
