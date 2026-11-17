-- planters: outdoor planters get the 9:00 weather alerts. Existing planters start indoor.
ALTER TABLE planters ADD COLUMN outdoor BOOLEAN NOT NULL DEFAULT false;

-- The app never wrote location_type; only the dev/staging seed filled it.
UPDATE planters SET outdoor = true WHERE location_type = 'outdoor';
ALTER TABLE planters DROP COLUMN location_type;
