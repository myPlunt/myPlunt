-- Which kinds of notifications the user wants; everything is on until they turn it off in Settings.
ALTER TABLE users
    ADD COLUMN notify_water_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN notify_weather_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN notify_friend_activity BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN notify_friend_nudges BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN notify_plant_sitting BOOLEAN NOT NULL DEFAULT TRUE;
