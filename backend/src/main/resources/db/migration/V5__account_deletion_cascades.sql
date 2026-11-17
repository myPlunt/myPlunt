-- FMP-037: deleting an account must leave nothing of it on other people's screens either. Notifications it
-- caused name the user in their text, and photos it took of a friend's plant while minding it live in the
-- user's storage folder, which is deleted with the account. Both kept the row with a null user before.
ALTER TABLE notifications
    DROP CONSTRAINT fk_notifications_from_user_id,
    ADD CONSTRAINT fk_notifications_from_user_id FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE plant_photos
    DROP CONSTRAINT fk_plant_photos_uploaded_by,
    ADD CONSTRAINT fk_plant_photos_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;
