-- Care details the owner fills in when adding a plant. All optional: only the
-- name is required. watering_every_days drives the watering reminders.
ALTER TABLE plants
    ADD COLUMN light                VARCHAR(255)
        CONSTRAINT chk_plants_light CHECK (light IN ('full_sun', 'bright_indirect', 'partial_shade', 'low_light')),
    ADD COLUMN watering_every_days  INT
        CONSTRAINT chk_plants_watering_every_days_range CHECK (watering_every_days BETWEEN 1 AND 365),
    ADD COLUMN notes                TEXT;
