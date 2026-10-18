-- A short note the owner can add to a growth photo ("First split leaf!"). Optional, so
-- existing photos keep NULL.
ALTER TABLE plant_photos ADD COLUMN caption VARCHAR(280);
