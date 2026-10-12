-- image_key points at the species' picture in object storage (null = no picture yet).
-- is_common marks the everyday plants people own (basil, snake plant...), set by admins.
ALTER TABLE species
    ADD COLUMN image_key VARCHAR(512),
    ADD COLUMN is_common BOOLEAN NOT NULL DEFAULT false;
