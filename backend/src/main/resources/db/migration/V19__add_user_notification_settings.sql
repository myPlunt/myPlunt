-- user_settings (V1) already holds the other notification switches; friends nudging the user to water is new.
ALTER TABLE user_settings
    ADD COLUMN friend_nudges BOOLEAN NOT NULL DEFAULT TRUE;
