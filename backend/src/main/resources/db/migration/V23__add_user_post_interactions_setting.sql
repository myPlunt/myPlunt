-- user_settings (V1) holds the other notification switches; friends liking or commenting on the
-- user's posts (and replies where they commented) is new.
ALTER TABLE user_settings
    ADD COLUMN post_interactions BOOLEAN NOT NULL DEFAULT TRUE;
