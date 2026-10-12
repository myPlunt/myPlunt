-- The species each user has ever owned a plant of: the Pluntdex's "caught" list. A row stays
-- when the plant is deleted, so a species is caught for good once the user has had one.
CREATE TABLE caught_species (
    user_id     UUID NOT NULL CONSTRAINT fk_caught_species_user_id REFERENCES users(id) ON DELETE CASCADE,
    species_id  UUID NOT NULL CONSTRAINT fk_caught_species_species_id REFERENCES species(id) ON DELETE CASCADE,
    caught_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_caught_species PRIMARY KEY (user_id, species_id)
);

-- Plants added before this table count too, caught when the first of them was added.
INSERT INTO caught_species (user_id, species_id, caught_at)
SELECT owner_id, species_id, MIN(created_at)
FROM plants
WHERE species_id IS NOT NULL
GROUP BY owner_id, species_id;
