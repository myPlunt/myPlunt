-- Realistic dev/staging data on top of V2, V3 and V6, so every screen has something real to show.
-- Pictures: the *_key columns are storage keys. On startup, StorageConfig downloads a real photo for
-- each one listed in db/seed/seed-images.csv, so no image files live in the repo. Keys get the
-- environment's storage prefix ("staging/avatars/..."), like real uploads: ${storagePrefix} is a
-- Flyway placeholder for app.storage.prefix, and concat_ws skips it when it's empty.
-- Everyone can log in with password123. Watering times are relative to now(), like V3, so the
-- gardens always show a mix of overdue, today, tomorrow and later.

-- The V2 users had placeholder hashes, so they couldn't log in.
UPDATE users SET password_hash = '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e'
WHERE id IN ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003');

UPDATE users SET bio = 'Monstera mum. George is my firstborn.', avatar_key = concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000001/seed.png') WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE users SET bio = 'Balcony gardener, slowly learning what ''bright indirect'' means.', avatar_key = concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000002/seed.png') WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE users SET bio = 'Still grieving my monstera.', avatar_key = concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000003/seed.png') WHERE id = '10000000-0000-0000-0000-000000000003';
UPDATE users SET bio = 'Herbs on the windowsill, flowers on the balcony.', avatar_key = concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000031/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000031';

-- Usernames chosen so search has exact, prefix and contains matches for "jane".
-- jane_doe and fern.gully have no picture, so the person icon still shows up somewhere.
INSERT INTO users (id, username, email, password_hash, avatar_key, city, bio)
VALUES
    ('10000000-0000-0000-0000-000000000101', 'jane', 'jane@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000101/seed.jpg'), 'Utrecht', 'Fern collector and chronic overwaterer 🌿'),
    ('10000000-0000-0000-0000-000000000102', 'jane_doe', 'jane_doe@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', NULL, 'Rotterdam', 'Just here for the cacti.'),
    ('10000000-0000-0000-0000-000000000103', 'mary_jane', 'mary_jane@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000103/seed.jpg'), 'Amsterdam', 'Herbs on every windowsill.'),
    ('10000000-0000-0000-0000-000000000104', 'janet', 'janet@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000104/seed.jpg'), 'Deventer', 'Balcony tomato grower 🍅'),
    ('10000000-0000-0000-0000-000000000105', 'plantdad', 'plantdad@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000105/seed.jpg'), 'Zwolle', 'Dad of 14 plants and 0 cats.'),
    ('10000000-0000-0000-0000-000000000106', 'fern.gully', 'ferngully@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', NULL, 'Leiden', 'Ferns, mosses and anything that likes the shade.'),
    ('10000000-0000-0000-0000-000000000107', 'succulent_sam', 'succulent_sam@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000107/seed.jpg'), 'Groningen', 'Succulents are the only plants that forgive me.'),
    ('10000000-0000-0000-0000-000000000108', 'green_thumb', 'green_thumb@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000108/seed.jpg'), 'Arnhem', 'Propagating everything I can get my hands on: pothos cuttings in every jar, spider plant babies on every shelf, and a pilea that keeps having pups faster than I can give them away. Ask me for a cutting, seriously, I have far too many of them.');

INSERT INTO user_settings (user_id)
VALUES
    ('10000000-0000-0000-0000-000000000101'),
    ('10000000-0000-0000-0000-000000000102'),
    ('10000000-0000-0000-0000-000000000103'),
    ('10000000-0000-0000-0000-000000000104'),
    ('10000000-0000-0000-0000-000000000105'),
    ('10000000-0000-0000-0000-000000000106'),
    ('10000000-0000-0000-0000-000000000107'),
    ('10000000-0000-0000-0000-000000000108');

-- George the Monstera's photo from V2, with the prefix added.
UPDATE plant_photos SET photo_key = concat_ws('/', nullif('${storagePrefix}', ''), 'posts/10000000-0000-0000-0000-000000000001/seed.png') WHERE id = '10000000-0000-0000-0000-000000000016';

-- Pictures for the species seeded earlier.
UPDATE species SET image_key = concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000009/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000009';
UPDATE species SET image_key = concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000010/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000010';
UPDATE species SET image_key = concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000032/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000032';
UPDATE species SET image_key = concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000033/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000033';
UPDATE species SET image_key = concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000034/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000034';
UPDATE species SET image_key = concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000035/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000035';
UPDATE species SET image_key = concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000036/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000036';
UPDATE species SET image_key = concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000052/seed.jpg') WHERE id = '10000000-0000-0000-0000-000000000052';

INSERT INTO species (id, common_name, scientific_name, region, watering_frequency_days, sunlight_needs, is_approved, is_common, image_key)
VALUES
    ('10000000-0000-0000-0000-000000000111', 'Peace lily', 'Spathiphyllum wallisii', 'Central America', 7, 'Low to bright indirect', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000111/seed.jpg')),
    ('10000000-0000-0000-0000-000000000112', 'ZZ plant', 'Zamioculcas zamiifolia', 'East Africa', 14, 'Low to bright indirect', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000112/seed.jpg')),
    ('10000000-0000-0000-0000-000000000113', 'Fiddle-leaf fig', 'Ficus lyrata', 'West Africa', 7, 'Bright indirect', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000113/seed.jpg')),
    ('10000000-0000-0000-0000-000000000114', 'Rubber plant', 'Ficus elastica', 'South Asia', 10, 'Bright indirect', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000114/seed.jpg')),
    ('10000000-0000-0000-0000-000000000115', 'Spider plant', 'Chlorophytum comosum', 'Southern Africa', 7, 'Bright indirect', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000115/seed.jpg')),
    ('10000000-0000-0000-0000-000000000116', 'Aloe vera', 'Aloe vera', 'Arabian Peninsula', 14, 'Full sun', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000116/seed.jpg')),
    ('10000000-0000-0000-0000-000000000117', 'Jade plant', 'Crassula ovata', 'Southern Africa', 14, 'Full sun', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000117/seed.jpg')),
    ('10000000-0000-0000-0000-000000000118', 'Boston fern', 'Nephrolepis exaltata', 'Central America', 3, 'Partial shade', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000118/seed.jpg')),
    ('10000000-0000-0000-0000-000000000119', 'Chinese money plant', 'Pilea peperomioides', 'China', 7, 'Bright indirect', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000119/seed.jpg')),
    ('10000000-0000-0000-0000-000000000120', 'String of pearls', 'Curio rowleyanus', 'Southern Africa', 14, 'Bright indirect', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000120/seed.jpg')),
    ('10000000-0000-0000-0000-000000000121', 'Prayer plant', 'Maranta leuconeura', 'South America', 5, 'Partial shade', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000121/seed.jpg')),
    ('10000000-0000-0000-0000-000000000122', 'Bird of paradise', 'Strelitzia reginae', 'Southern Africa', 7, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000122/seed.jpg')),
    ('10000000-0000-0000-0000-000000000123', 'Lavender', 'Lavandula angustifolia', 'Mediterranean', 10, 'Full sun', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000123/seed.jpg')),
    ('10000000-0000-0000-0000-000000000124', 'Thyme', 'Thymus vulgaris', 'Mediterranean', 7, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000124/seed.jpg')),
    ('10000000-0000-0000-0000-000000000125', 'Tomato', 'Solanum lycopersicum', 'South America', 2, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000125/seed.jpg')),
    ('10000000-0000-0000-0000-000000000126', 'Strawberry', 'Fragaria × ananassa', 'Europe', 3, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000126/seed.jpg')),
    ('10000000-0000-0000-0000-000000000127', 'Sunflower', 'Helianthus annuus', 'North America', 3, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000127/seed.jpg')),
    ('10000000-0000-0000-0000-000000000128', 'Echeveria', 'Echeveria elegans', 'Central America', 14, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000128/seed.jpg')),
    ('10000000-0000-0000-0000-000000000129', 'Golden barrel cactus', 'Kroenleinia grusonii', 'Central America', 21, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000129/seed.jpg')),
    ('10000000-0000-0000-0000-000000000130', 'Moth orchid', 'Phalaenopsis amabilis', 'Southeast Asia', 7, 'Bright indirect', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000130/seed.jpg')),
    ('10000000-0000-0000-0000-000000000131', 'English ivy', 'Hedera helix', 'Europe', 5, 'Partial shade', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000131/seed.jpg')),
    ('10000000-0000-0000-0000-000000000132', 'Hydrangea', 'Hydrangea macrophylla', 'East Asia', 3, 'Partial shade', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000132/seed.jpg'));

INSERT INTO planters (id, owner_id, name, location_type)
VALUES
    ('10000000-0000-0000-0000-000000000141', '10000000-0000-0000-0000-000000000001', 'Bedroom window', 'indoor'),
    ('10000000-0000-0000-0000-000000000142', '10000000-0000-0000-0000-000000000101', 'Bathroom', 'indoor'),
    ('10000000-0000-0000-0000-000000000143', '10000000-0000-0000-0000-000000000101', 'Desk', 'indoor'),
    ('10000000-0000-0000-0000-000000000144', '10000000-0000-0000-0000-000000000103', 'Kitchen windowsill', 'indoor'),
    ('10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000105', 'Greenhouse', 'outdoor'),
    ('10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000105', 'Porch', 'outdoor'),
    ('10000000-0000-0000-0000-000000000147', '10000000-0000-0000-0000-000000000107', 'Sunny shelf', 'indoor'),
    ('10000000-0000-0000-0000-000000000148', '10000000-0000-0000-0000-000000000104', 'Balcony', 'outdoor');

-- light, watering_every_days and notes are the care details the owner filled in. An own
-- watering_every_days wins over the species' frequency. Mystery cutting has no species at all.
INSERT INTO plants (id, owner_id, planter_id, species_id, name, is_alive, cause_of_death, light, watering_every_days, notes, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000161', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000113', 'Fiddle Dee', true, NULL, 'bright_indirect', 5, 'Hates being moved. Don''t move it.', now() - interval '15 days'),
    ('10000000-0000-0000-0000-000000000162', '10000000-0000-0000-0000-000000000031', NULL, '10000000-0000-0000-0000-000000000120', 'Pearl', true, NULL, 'bright_indirect', NULL, 'Let the soil dry out completely between waterings.', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000163', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000127', 'Sunny', false, 'Eaten by snails', NULL, NULL, NULL, now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000164', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000125', 'Tommy', true, NULL, 'full_sun', NULL, 'Cherry tomatoes. Needs a stake soon.', now() - interval '12 days'),
    ('10000000-0000-0000-0000-000000000165', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000141', '10000000-0000-0000-0000-000000000111', 'Lily', true, NULL, 'low_light', 6, 'Droops dramatically when thirsty, perks up within an hour.', now() - interval '60 days'),
    ('10000000-0000-0000-0000-000000000166', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000141', '10000000-0000-0000-0000-000000000112', 'Zed', true, NULL, 'low_light', NULL, NULL, now() - interval '90 days'),
    ('10000000-0000-0000-0000-000000000167', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000052', 'Spike', true, NULL, 'low_light', NULL, 'Basically unkillable.', now() - interval '120 days'),
    ('10000000-0000-0000-0000-000000000168', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000141', '10000000-0000-0000-0000-000000000116', 'Aloe Blacc', true, NULL, 'full_sun', 12, 'Gel is great for sunburns.', now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000169', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000119', 'Pip', true, NULL, 'bright_indirect', NULL, 'Gave three pups away to friends already.', now() - interval '21 days'),
    ('10000000-0000-0000-0000-000000000170', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000142', '10000000-0000-0000-0000-000000000118', 'Fernando', true, NULL, 'partial_shade', 2, 'Likes the steamy bathroom. Mist when the heating is on.', now() - interval '45 days'),
    ('10000000-0000-0000-0000-000000000171', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000142', '10000000-0000-0000-0000-000000000121', 'Prayer Pete', true, NULL, 'partial_shade', NULL, 'Folds its leaves up at night.', now() - interval '33 days'),
    ('10000000-0000-0000-0000-000000000172', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000143', '10000000-0000-0000-0000-000000000115', 'Spidey', true, NULL, 'bright_indirect', NULL, NULL, now() - interval '50 days'),
    ('10000000-0000-0000-0000-000000000173', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000143', '10000000-0000-0000-0000-000000000131', 'Ivy', true, NULL, NULL, NULL, NULL, now() - interval '20 days'),
    ('10000000-0000-0000-0000-000000000174', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000142', '10000000-0000-0000-0000-000000000118', 'Crispy', false, 'Forgot to water it on holiday', NULL, NULL, NULL, now() - interval '80 days'),
    ('10000000-0000-0000-0000-000000000175', '10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000144', '10000000-0000-0000-0000-000000000034', 'Basil Fawlty', true, NULL, 'full_sun', 2, 'Harvest from the top, never more than a third at once.', now() - interval '25 days'),
    ('10000000-0000-0000-0000-000000000176', '10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000144', '10000000-0000-0000-0000-000000000035', 'Rosie', true, NULL, 'full_sun', NULL, NULL, now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000177', '10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000144', '10000000-0000-0000-0000-000000000036', 'Minty Fresh', true, NULL, NULL, NULL, NULL, now() - interval '18 days'),
    ('10000000-0000-0000-0000-000000000178', '10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000144', '10000000-0000-0000-0000-000000000124', 'Thyme Lord', true, NULL, 'full_sun', NULL, 'Lemon thyme, great with chicken.', now() - interval '18 days'),
    ('10000000-0000-0000-0000-000000000179', '10000000-0000-0000-0000-000000000103', NULL, '10000000-0000-0000-0000-000000000130', 'Phala', true, NULL, 'bright_indirect', 10, 'Soak the roots for 10 minutes, then drain well.', now() - interval '70 days'),
    ('10000000-0000-0000-0000-000000000180', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000122', 'Big Bird', true, NULL, 'full_sun', NULL, 'Flowered for the first time this summer!', now() - interval '200 days'),
    ('10000000-0000-0000-0000-000000000181', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000114', 'Rubber Ducky', true, NULL, 'bright_indirect', NULL, NULL, now() - interval '150 days'),
    ('10000000-0000-0000-0000-000000000182', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000132', 'Hydra', true, NULL, NULL, NULL, NULL, now() - interval '60 days'),
    ('10000000-0000-0000-0000-000000000183', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000126', 'Strawbs', true, NULL, 'full_sun', 2, 'Netted against the birds.', now() - interval '35 days'),
    ('10000000-0000-0000-0000-000000000184', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000123', 'Lavvy', true, NULL, NULL, NULL, NULL, now() - interval '50 days'),
    ('10000000-0000-0000-0000-000000000185', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000124', 'Thymothy', true, NULL, NULL, NULL, NULL, now() - interval '50 days'),
    ('10000000-0000-0000-0000-000000000186', '10000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000147', '10000000-0000-0000-0000-000000000129', 'Spiky Mike', true, NULL, 'full_sun', NULL, 'Do not hug.', now() - interval '300 days'),
    ('10000000-0000-0000-0000-000000000187', '10000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000147', '10000000-0000-0000-0000-000000000117', 'Jade Pinkett', true, NULL, 'full_sun', NULL, 'Repotted in March.', now() - interval '180 days'),
    ('10000000-0000-0000-0000-000000000188', '10000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000147', '10000000-0000-0000-0000-000000000128', 'Eve', true, NULL, NULL, NULL, NULL, now() - interval '90 days'),
    ('10000000-0000-0000-0000-000000000189', '10000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000147', '10000000-0000-0000-0000-000000000120', 'Pearl Jam', true, NULL, 'bright_indirect', NULL, 'Water from the bottom so the pearls don''t rot.', now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000190', '10000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000147', '10000000-0000-0000-0000-000000000128', 'Mushy', false, 'Overwatering', NULL, NULL, NULL, now() - interval '120 days'),
    ('10000000-0000-0000-0000-000000000191', '10000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000148', '10000000-0000-0000-0000-000000000125', 'Big Tom', true, NULL, NULL, NULL, NULL, now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000192', '10000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000148', '10000000-0000-0000-0000-000000000125', 'Cherry', true, NULL, NULL, NULL, NULL, now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000193', '10000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000148', '10000000-0000-0000-0000-000000000127', 'Sunshine', true, NULL, NULL, NULL, NULL, now() - interval '20 days'),
    ('10000000-0000-0000-0000-000000000194', '10000000-0000-0000-0000-000000000031', NULL, NULL, 'Mystery cutting', true, NULL, NULL, NULL, NULL, now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000195', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000143', '10000000-0000-0000-0000-000000000121', 'Just Arrived', true, NULL, NULL, NULL, NULL, now() - interval '0 days'),
    ('10000000-0000-0000-0000-000000000196', '10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000144', '10000000-0000-0000-0000-000000000123', 'Sir Reginald Fluffington the Third of the Kitchen Windowsill', true, NULL, 'full_sun', NULL, 'Named by my niece.', now() - interval '14 days'),
    ('10000000-0000-0000-0000-000000000197', '10000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000147', '10000000-0000-0000-0000-000000000129', 'Forgotten Fred', true, NULL, 'full_sun', NULL, NULL, now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000198', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000111', 'Peace Out', true, NULL, NULL, NULL, NULL, now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000199', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000112', 'Zeezee', true, NULL, NULL, NULL, NULL, now() - interval '100 days'),
    ('10000000-0000-0000-0000-000000000200', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000113', 'Fig Newton', true, NULL, NULL, NULL, NULL, now() - interval '80 days'),
    ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000115', 'Spidey Sr.', true, NULL, NULL, NULL, NULL, now() - interval '120 days'),
    ('10000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000117', 'Jadey', true, NULL, NULL, NULL, NULL, now() - interval '90 days'),
    ('10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000119', 'Pancake', true, NULL, NULL, NULL, NULL, now() - interval '25 days'),
    ('10000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000130', 'Orchie', true, NULL, NULL, NULL, NULL, now() - interval '60 days'),
    ('10000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000131', 'Ivan', true, NULL, NULL, NULL, NULL, now() - interval '30 days');

-- Care details for the plants seeded in V2 and V3.
UPDATE plants SET light = 'bright_indirect', notes = 'Wipe the leaves once a month. Has a moss pole since spring.' WHERE id = '10000000-0000-0000-0000-000000000013';
UPDATE plants SET light = 'full_sun', notes = NULL WHERE id = '10000000-0000-0000-0000-000000000040';
UPDATE plants SET light = 'full_sun', notes = 'Deadhead the old flowers for more blooms.' WHERE id = '10000000-0000-0000-0000-000000000041';
UPDATE plants SET light = 'bright_indirect', notes = 'Turn a quarter every week so it grows straight.' WHERE id = '10000000-0000-0000-0000-000000000042';
UPDATE plants SET light = 'full_sun', notes = 'Pinch the tops off before it flowers.' WHERE id = '10000000-0000-0000-0000-000000000043';
UPDATE plants SET light = 'full_sun', notes = NULL WHERE id = '10000000-0000-0000-0000-000000000044';
UPDATE plants SET light = 'partial_shade', notes = 'Keeps trying to take over the whole windowsill.' WHERE id = '10000000-0000-0000-0000-000000000045';

-- Next watering = last watering + the plant's frequency (see WateringSchedule). Each watered plant
-- gets its last watering plus two earlier ones, one frequency apart. Just Arrived and Forgotten Fred
-- were never watered, so they count from the day they were added.
INSERT INTO watering_logs (plant_id, watered_by, watered_at)
VALUES
    ('10000000-0000-0000-0000-000000000161', '10000000-0000-0000-0000-000000000031', now() - interval '9 days'),
    ('10000000-0000-0000-0000-000000000161', '10000000-0000-0000-0000-000000000031', now() - interval '14 days'),
    ('10000000-0000-0000-0000-000000000162', '10000000-0000-0000-0000-000000000031', now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000164', '10000000-0000-0000-0000-000000000031', now() - interval '1 days'),
    ('10000000-0000-0000-0000-000000000164', '10000000-0000-0000-0000-000000000031', now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000164', '10000000-0000-0000-0000-000000000031', now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000165', '10000000-0000-0000-0000-000000000001', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000165', '10000000-0000-0000-0000-000000000001', now() - interval '13 days'),
    ('10000000-0000-0000-0000-000000000165', '10000000-0000-0000-0000-000000000001', now() - interval '19 days'),
    ('10000000-0000-0000-0000-000000000166', '10000000-0000-0000-0000-000000000001', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000166', '10000000-0000-0000-0000-000000000001', now() - interval '18 days'),
    ('10000000-0000-0000-0000-000000000166', '10000000-0000-0000-0000-000000000001', now() - interval '32 days'),
    ('10000000-0000-0000-0000-000000000167', '10000000-0000-0000-0000-000000000001', now() - interval '15 days'),
    ('10000000-0000-0000-0000-000000000167', '10000000-0000-0000-0000-000000000001', now() - interval '29 days'),
    ('10000000-0000-0000-0000-000000000167', '10000000-0000-0000-0000-000000000001', now() - interval '43 days'),
    ('10000000-0000-0000-0000-000000000168', '10000000-0000-0000-0000-000000000001', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000168', '10000000-0000-0000-0000-000000000001', now() - interval '14 days'),
    ('10000000-0000-0000-0000-000000000168', '10000000-0000-0000-0000-000000000001', now() - interval '26 days'),
    ('10000000-0000-0000-0000-000000000169', '10000000-0000-0000-0000-000000000001', now() - interval '6 days'),
    ('10000000-0000-0000-0000-000000000169', '10000000-0000-0000-0000-000000000001', now() - interval '13 days'),
    ('10000000-0000-0000-0000-000000000169', '10000000-0000-0000-0000-000000000001', now() - interval '20 days'),
    ('10000000-0000-0000-0000-000000000170', '10000000-0000-0000-0000-000000000101', now() - interval '1 days'),
    ('10000000-0000-0000-0000-000000000170', '10000000-0000-0000-0000-000000000101', now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000170', '10000000-0000-0000-0000-000000000101', now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000171', '10000000-0000-0000-0000-000000000101', now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000171', '10000000-0000-0000-0000-000000000101', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000171', '10000000-0000-0000-0000-000000000101', now() - interval '15 days'),
    ('10000000-0000-0000-0000-000000000172', '10000000-0000-0000-0000-000000000101', now() - interval '8 days'),
    ('10000000-0000-0000-0000-000000000172', '10000000-0000-0000-0000-000000000101', now() - interval '15 days'),
    ('10000000-0000-0000-0000-000000000172', '10000000-0000-0000-0000-000000000101', now() - interval '22 days'),
    ('10000000-0000-0000-0000-000000000173', '10000000-0000-0000-0000-000000000101', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000173', '10000000-0000-0000-0000-000000000101', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000173', '10000000-0000-0000-0000-000000000101', now() - interval '12 days'),
    ('10000000-0000-0000-0000-000000000175', '10000000-0000-0000-0000-000000000103', now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000175', '10000000-0000-0000-0000-000000000103', now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000175', '10000000-0000-0000-0000-000000000103', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000176', '10000000-0000-0000-0000-000000000103', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000176', '10000000-0000-0000-0000-000000000103', now() - interval '9 days'),
    ('10000000-0000-0000-0000-000000000176', '10000000-0000-0000-0000-000000000103', now() - interval '16 days'),
    ('10000000-0000-0000-0000-000000000177', '10000000-0000-0000-0000-000000000103', now() - interval '1 days'),
    ('10000000-0000-0000-0000-000000000177', '10000000-0000-0000-0000-000000000103', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000177', '10000000-0000-0000-0000-000000000103', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000178', '10000000-0000-0000-0000-000000000103', now() - interval '9 days'),
    ('10000000-0000-0000-0000-000000000178', '10000000-0000-0000-0000-000000000103', now() - interval '16 days'),
    ('10000000-0000-0000-0000-000000000179', '10000000-0000-0000-0000-000000000103', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000179', '10000000-0000-0000-0000-000000000103', now() - interval '14 days'),
    ('10000000-0000-0000-0000-000000000179', '10000000-0000-0000-0000-000000000103', now() - interval '24 days'),
    ('10000000-0000-0000-0000-000000000180', '10000000-0000-0000-0000-000000000105', now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000180', '10000000-0000-0000-0000-000000000105', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000180', '10000000-0000-0000-0000-000000000105', now() - interval '17 days'),
    ('10000000-0000-0000-0000-000000000181', '10000000-0000-0000-0000-000000000105', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000181', '10000000-0000-0000-0000-000000000105', now() - interval '20 days'),
    ('10000000-0000-0000-0000-000000000181', '10000000-0000-0000-0000-000000000105', now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000182', '10000000-0000-0000-0000-000000000105', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000182', '10000000-0000-0000-0000-000000000105', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000182', '10000000-0000-0000-0000-000000000105', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000183', '10000000-0000-0000-0000-000000000105', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000183', '10000000-0000-0000-0000-000000000105', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000183', '10000000-0000-0000-0000-000000000105', now() - interval '6 days'),
    ('10000000-0000-0000-0000-000000000184', '10000000-0000-0000-0000-000000000105', now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000184', '10000000-0000-0000-0000-000000000105', now() - interval '13 days'),
    ('10000000-0000-0000-0000-000000000184', '10000000-0000-0000-0000-000000000105', now() - interval '23 days'),
    ('10000000-0000-0000-0000-000000000185', '10000000-0000-0000-0000-000000000105', now() - interval '6 days'),
    ('10000000-0000-0000-0000-000000000185', '10000000-0000-0000-0000-000000000105', now() - interval '13 days'),
    ('10000000-0000-0000-0000-000000000185', '10000000-0000-0000-0000-000000000105', now() - interval '20 days'),
    ('10000000-0000-0000-0000-000000000186', '10000000-0000-0000-0000-000000000107', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000186', '10000000-0000-0000-0000-000000000107', now() - interval '31 days'),
    ('10000000-0000-0000-0000-000000000186', '10000000-0000-0000-0000-000000000107', now() - interval '52 days'),
    ('10000000-0000-0000-0000-000000000187', '10000000-0000-0000-0000-000000000107', now() - interval '14 days'),
    ('10000000-0000-0000-0000-000000000187', '10000000-0000-0000-0000-000000000107', now() - interval '28 days'),
    ('10000000-0000-0000-0000-000000000187', '10000000-0000-0000-0000-000000000107', now() - interval '42 days'),
    ('10000000-0000-0000-0000-000000000188', '10000000-0000-0000-0000-000000000107', now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000188', '10000000-0000-0000-0000-000000000107', now() - interval '19 days'),
    ('10000000-0000-0000-0000-000000000188', '10000000-0000-0000-0000-000000000107', now() - interval '33 days'),
    ('10000000-0000-0000-0000-000000000189', '10000000-0000-0000-0000-000000000107', now() - interval '16 days'),
    ('10000000-0000-0000-0000-000000000189', '10000000-0000-0000-0000-000000000107', now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000191', '10000000-0000-0000-0000-000000000104', now() - interval '0 days'),
    ('10000000-0000-0000-0000-000000000191', '10000000-0000-0000-0000-000000000104', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000191', '10000000-0000-0000-0000-000000000104', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000192', '10000000-0000-0000-0000-000000000104', now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000192', '10000000-0000-0000-0000-000000000104', now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000192', '10000000-0000-0000-0000-000000000104', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000193', '10000000-0000-0000-0000-000000000104', now() - interval '1 days'),
    ('10000000-0000-0000-0000-000000000193', '10000000-0000-0000-0000-000000000104', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000193', '10000000-0000-0000-0000-000000000104', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000194', '10000000-0000-0000-0000-000000000031', now() - interval '1 days'),
    ('10000000-0000-0000-0000-000000000196', '10000000-0000-0000-0000-000000000103', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000196', '10000000-0000-0000-0000-000000000103', now() - interval '14 days'),
    ('10000000-0000-0000-0000-000000000198', '10000000-0000-0000-0000-000000000105', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000198', '10000000-0000-0000-0000-000000000105', now() - interval '14 days'),
    ('10000000-0000-0000-0000-000000000198', '10000000-0000-0000-0000-000000000105', now() - interval '21 days'),
    ('10000000-0000-0000-0000-000000000199', '10000000-0000-0000-0000-000000000105', now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000199', '10000000-0000-0000-0000-000000000105', now() - interval '17 days'),
    ('10000000-0000-0000-0000-000000000199', '10000000-0000-0000-0000-000000000105', now() - interval '31 days'),
    ('10000000-0000-0000-0000-000000000200', '10000000-0000-0000-0000-000000000105', now() - interval '8 days'),
    ('10000000-0000-0000-0000-000000000200', '10000000-0000-0000-0000-000000000105', now() - interval '15 days'),
    ('10000000-0000-0000-0000-000000000200', '10000000-0000-0000-0000-000000000105', now() - interval '22 days'),
    ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000105', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000105', now() - interval '9 days'),
    ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000105', now() - interval '16 days'),
    ('10000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000105', now() - interval '13 days'),
    ('10000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000105', now() - interval '27 days'),
    ('10000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000105', now() - interval '41 days'),
    ('10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000105', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000105', now() - interval '11 days'),
    ('10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000105', now() - interval '18 days'),
    ('10000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000105', now() - interval '6 days'),
    ('10000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000105', now() - interval '13 days'),
    ('10000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000105', now() - interval '20 days'),
    ('10000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000105', now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000105', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000105', now() - interval '15 days');

-- Older waterings for the V3 garden, which only had its latest one.
INSERT INTO watering_logs (plant_id, watered_by, watered_at)
SELECT l.plant_id, l.watered_by, l.watered_at - make_interval(days => s.watering_frequency_days * k)
FROM watering_logs l
JOIN plants p ON p.id = l.plant_id
JOIN species s ON s.id = p.species_id
CROSS JOIN generate_series(1, 2) AS k
WHERE p.owner_id = '10000000-0000-0000-0000-000000000031' AND p.created_at < now() - interval '20 days';

INSERT INTO plant_photos (plant_id, uploaded_by, photo_key, taken_at)
VALUES
    ('10000000-0000-0000-0000-000000000161', '10000000-0000-0000-0000-000000000031', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000031/10000000-0000-0000-0000-000000000161.jpg'), now() - interval '15 days'),
    ('10000000-0000-0000-0000-000000000162', '10000000-0000-0000-0000-000000000031', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000031/10000000-0000-0000-0000-000000000162.jpg'), now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000164', '10000000-0000-0000-0000-000000000031', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000031/10000000-0000-0000-0000-000000000164.jpg'), now() - interval '12 days'),
    ('10000000-0000-0000-0000-000000000165', '10000000-0000-0000-0000-000000000001', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000165.jpg'), now() - interval '60 days'),
    ('10000000-0000-0000-0000-000000000166', '10000000-0000-0000-0000-000000000001', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000166.jpg'), now() - interval '90 days'),
    ('10000000-0000-0000-0000-000000000167', '10000000-0000-0000-0000-000000000001', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000167.jpg'), now() - interval '120 days'),
    ('10000000-0000-0000-0000-000000000168', '10000000-0000-0000-0000-000000000001', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000168.jpg'), now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000169', '10000000-0000-0000-0000-000000000001', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000169.jpg'), now() - interval '21 days'),
    ('10000000-0000-0000-0000-000000000170', '10000000-0000-0000-0000-000000000101', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000101/10000000-0000-0000-0000-000000000170.jpg'), now() - interval '45 days'),
    ('10000000-0000-0000-0000-000000000171', '10000000-0000-0000-0000-000000000101', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000101/10000000-0000-0000-0000-000000000171.jpg'), now() - interval '33 days'),
    ('10000000-0000-0000-0000-000000000172', '10000000-0000-0000-0000-000000000101', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000101/10000000-0000-0000-0000-000000000172.jpg'), now() - interval '50 days'),
    ('10000000-0000-0000-0000-000000000173', '10000000-0000-0000-0000-000000000101', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000101/10000000-0000-0000-0000-000000000173.jpg'), now() - interval '20 days'),
    ('10000000-0000-0000-0000-000000000175', '10000000-0000-0000-0000-000000000103', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000103/10000000-0000-0000-0000-000000000175.jpg'), now() - interval '25 days'),
    ('10000000-0000-0000-0000-000000000176', '10000000-0000-0000-0000-000000000103', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000103/10000000-0000-0000-0000-000000000176.jpg'), now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000177', '10000000-0000-0000-0000-000000000103', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000103/10000000-0000-0000-0000-000000000177.jpg'), now() - interval '18 days'),
    ('10000000-0000-0000-0000-000000000178', '10000000-0000-0000-0000-000000000103', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000103/10000000-0000-0000-0000-000000000178.jpg'), now() - interval '18 days'),
    ('10000000-0000-0000-0000-000000000179', '10000000-0000-0000-0000-000000000103', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000103/10000000-0000-0000-0000-000000000179.jpg'), now() - interval '70 days'),
    ('10000000-0000-0000-0000-000000000180', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000180.jpg'), now() - interval '200 days'),
    ('10000000-0000-0000-0000-000000000181', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000181.jpg'), now() - interval '150 days'),
    ('10000000-0000-0000-0000-000000000182', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000182.jpg'), now() - interval '60 days'),
    ('10000000-0000-0000-0000-000000000183', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000183.jpg'), now() - interval '35 days'),
    ('10000000-0000-0000-0000-000000000184', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000184.jpg'), now() - interval '50 days'),
    ('10000000-0000-0000-0000-000000000185', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000185.jpg'), now() - interval '50 days'),
    ('10000000-0000-0000-0000-000000000186', '10000000-0000-0000-0000-000000000107', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000107/10000000-0000-0000-0000-000000000186.jpg'), now() - interval '300 days'),
    ('10000000-0000-0000-0000-000000000187', '10000000-0000-0000-0000-000000000107', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000107/10000000-0000-0000-0000-000000000187.jpg'), now() - interval '180 days'),
    ('10000000-0000-0000-0000-000000000188', '10000000-0000-0000-0000-000000000107', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000107/10000000-0000-0000-0000-000000000188.jpg'), now() - interval '90 days'),
    ('10000000-0000-0000-0000-000000000189', '10000000-0000-0000-0000-000000000107', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000107/10000000-0000-0000-0000-000000000189.jpg'), now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000191', '10000000-0000-0000-0000-000000000104', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000104/10000000-0000-0000-0000-000000000191.jpg'), now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000192', '10000000-0000-0000-0000-000000000104', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000104/10000000-0000-0000-0000-000000000192.jpg'), now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000193', '10000000-0000-0000-0000-000000000104', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000104/10000000-0000-0000-0000-000000000193.jpg'), now() - interval '20 days'),
    ('10000000-0000-0000-0000-000000000196', '10000000-0000-0000-0000-000000000103', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000103/10000000-0000-0000-0000-000000000196.jpg'), now() - interval '14 days'),
    ('10000000-0000-0000-0000-000000000197', '10000000-0000-0000-0000-000000000107', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000107/10000000-0000-0000-0000-000000000197.jpg'), now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000198', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000198.jpg'), now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000199', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000199.jpg'), now() - interval '100 days'),
    ('10000000-0000-0000-0000-000000000200', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000200.jpg'), now() - interval '80 days'),
    ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000201.jpg'), now() - interval '120 days'),
    ('10000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000202.jpg'), now() - interval '90 days'),
    ('10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000203.jpg'), now() - interval '25 days'),
    ('10000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000204.jpg'), now() - interval '60 days'),
    ('10000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000105', concat_ws('/', nullif('${storagePrefix}', ''), 'plants/10000000-0000-0000-0000-000000000105/10000000-0000-0000-0000-000000000205.jpg'), now() - interval '30 days');

-- Every species someone has a plant of is discovered (V7 only backfilled the plants that
-- existed back then), plus a few discovered through plants that were deleted since.
INSERT INTO discovered_species (user_id, species_id, discovered_at)
SELECT owner_id, species_id, MIN(created_at)
FROM plants
WHERE species_id IS NOT NULL
GROUP BY owner_id, species_id
ON CONFLICT DO NOTHING;

INSERT INTO discovered_species (user_id, species_id, discovered_at)
VALUES
    ('10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000131', now() - interval '50 days'),
    ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000123', now() - interval '100 days'),
    ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000128', now() - interval '60 days');

-- gardener has friends, one request to answer and one waiting on someone else.
INSERT INTO friendships (id, requester_id, receiver_id, status, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001', 'accepted', now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000502', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000031', 'accepted', now() - interval '25 days'),
    ('10000000-0000-0000-0000-000000000503', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000105', 'accepted', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000504', '10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000031', 'pending', now() - interval '1 days'),
    ('10000000-0000-0000-0000-000000000505', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000107', 'pending', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000506', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000103', 'accepted', now() - interval '60 days'),
    ('10000000-0000-0000-0000-000000000507', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000107', 'accepted', now() - interval '30 days');
