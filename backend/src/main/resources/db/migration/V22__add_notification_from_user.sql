-- Who the notification is from (the requester of a friend request), so the list can show their
-- profile picture. Null for notifications from the app itself, like watering reminders, and once
-- that account is deleted.
ALTER TABLE notifications
    ADD COLUMN from_user_id UUID CONSTRAINT fk_notifications_from_user_id REFERENCES users(id) ON DELETE SET NULL;
