-- The Pluntdex says "discovered", not "caught", so the table follows. Renaming the primary
-- key also renames its index.
ALTER TABLE caught_species RENAME TO discovered_species;
ALTER TABLE discovered_species RENAME COLUMN caught_at TO discovered_at;
ALTER TABLE discovered_species RENAME CONSTRAINT pk_caught_species TO pk_discovered_species;
ALTER TABLE discovered_species RENAME CONSTRAINT fk_caught_species_user_id TO fk_discovered_species_user_id;
ALTER TABLE discovered_species RENAME CONSTRAINT fk_caught_species_species_id TO fk_discovered_species_species_id;
