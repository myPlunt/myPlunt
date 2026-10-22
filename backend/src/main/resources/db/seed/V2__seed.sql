-- Dev and staging only: prod never loads db/seed. Every password is password123.
-- On startup StorageConfig downloads an image for each key in seed-images.csv. ${storagePrefix} is
-- app.storage.prefix, so keys match real uploads; concat_ws drops it when it's empty.
-- Times are relative to now(), so the gardens always show a mix of overdue, due and later.

-- gardener has the fullest garden. Search for "jane" gets exact, prefix and contains matches.
-- jane_doe and fern.gully have no picture, to show the fallback icon.
INSERT INTO users (id, username, email, password_hash, avatar_key, city, bio, watering_streak, onboarding_completed_at)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'alice', 'alice@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000001/seed.png'), 'Deventer', 'Monstera mum. George is my firstborn.', 3, now()),
    ('10000000-0000-0000-0000-000000000002', 'bob', 'bob@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000002/seed.png'), 'Amsterdam', 'Balcony gardener, slowly learning what ''bright indirect'' means.', 0, now()),
    ('10000000-0000-0000-0000-000000000003', 'greg', 'greg@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000003/seed.png'), 'Amsterdam', 'Still grieving my monstera.', 0, now()),
    ('10000000-0000-0000-0000-000000000031', 'gardener', 'gardener@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000031/seed.jpg'), 'Deventer', 'Herbs on the windowsill, flowers on the balcony.', 0, now()),
    ('10000000-0000-0000-0000-000000000101', 'jane', 'jane@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000101/seed.jpg'), 'Utrecht', 'Fern collector and chronic overwaterer 🌿', 0, now()),
    ('10000000-0000-0000-0000-000000000102', 'jane_doe', 'jane_doe@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', NULL, 'Rotterdam', 'Just here for the cacti.', 0, now()),
    ('10000000-0000-0000-0000-000000000103', 'mary_jane', 'mary_jane@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000103/seed.jpg'), 'Amsterdam', 'Herbs on every windowsill.', 0, now()),
    ('10000000-0000-0000-0000-000000000104', 'janet', 'janet@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000104/seed.jpg'), 'Deventer', 'Balcony tomato grower 🍅', 0, now()),
    ('10000000-0000-0000-0000-000000000105', 'plantdad', 'plantdad@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000105/seed.jpg'), 'Zwolle', 'Dad of 14 plants and 0 cats.', 0, now()),
    ('10000000-0000-0000-0000-000000000106', 'fern.gully', 'ferngully@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', NULL, 'Leiden', 'Ferns, mosses and anything that likes the shade.', 0, now()),
    ('10000000-0000-0000-0000-000000000107', 'succulent_sam', 'succulent_sam@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000107/seed.jpg'), 'Groningen', 'Succulents are the only plants that forgive me.', 0, now()),
    ('10000000-0000-0000-0000-000000000108', 'green_thumb', 'green_thumb@example.com', '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', concat_ws('/', nullif('${storagePrefix}', ''), 'avatars/10000000-0000-0000-0000-000000000108/seed.jpg'), 'Arnhem', 'Propagating everything I can get my hands on: pothos cuttings in every jar, spider plant babies on every shelf, and a pilea that keeps having pups faster than I can give them away. Ask me for a cutting, seriously, I have far too many of them.', 0, now());

INSERT INTO user_settings (user_id, post_visibility, weather_alerts, delegation_requests)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'public', true, true),
    ('10000000-0000-0000-0000-000000000002', 'public', false, true),
    ('10000000-0000-0000-0000-000000000003', 'private', true, false);

INSERT INTO user_settings (user_id)
VALUES
    ('10000000-0000-0000-0000-000000000031'),
    ('10000000-0000-0000-0000-000000000101'),
    ('10000000-0000-0000-0000-000000000102'),
    ('10000000-0000-0000-0000-000000000103'),
    ('10000000-0000-0000-0000-000000000104'),
    ('10000000-0000-0000-0000-000000000105'),
    ('10000000-0000-0000-0000-000000000106'),
    ('10000000-0000-0000-0000-000000000107'),
    ('10000000-0000-0000-0000-000000000108');

-- gardener has friends, one request to answer and one waiting on someone else.
INSERT INTO friendships (id, requester_id, receiver_id, status, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'accepted', now() - interval '45 days'),
    ('10000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'pending', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001', 'accepted', now() - interval '40 days'),
    ('10000000-0000-0000-0000-000000000502', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000031', 'accepted', now() - interval '25 days'),
    ('10000000-0000-0000-0000-000000000503', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000105', 'accepted', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000504', '10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000031', 'pending', now() - interval '1 days'),
    ('10000000-0000-0000-0000-000000000505', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000107', 'pending', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000506', '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000103', 'accepted', now() - interval '60 days'),
    ('10000000-0000-0000-0000-000000000507', '10000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000107', 'accepted', now() - interval '30 days');

INSERT INTO species (id, common_name, scientific_name, region, watering_frequency_days, sunlight_needs, notes, is_approved, is_common, submitted_by, approved_by, image_key)
VALUES
    ('10000000-0000-0000-0000-000000000009', 'Monstera', 'Monstera deliciosa', 'Central America', 7, 'Indirect', 'Popular houseplant, likes humidity.', true, true, '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000009/seed.jpg')),
    ('10000000-0000-0000-0000-000000000010', 'Pothos', 'Epipremnum aureum', 'Southeast Asia', 10, 'Low to bright indirect', 'Very forgiving, good for beginners.', false, false, '10000000-0000-0000-0000-000000000001', NULL, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000010/seed.jpg'));

INSERT INTO species (id, common_name, scientific_name, region, watering_frequency_days, sunlight_needs, is_approved, is_common, image_key)
VALUES
    ('10000000-0000-0000-0000-000000000032', 'Geranium', 'Pelargonium zonale', 'Southern Africa', 4, 'Full sun', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000032/seed.jpg')),
    ('10000000-0000-0000-0000-000000000033', 'Petunia', 'Petunia x atkinsiana', 'South America', 2, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000033/seed.jpg')),
    ('10000000-0000-0000-0000-000000000034', 'Sweet basil', 'Ocimum basilicum', 'Tropical Asia', 3, 'Bright direct', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000034/seed.jpg')),
    ('10000000-0000-0000-0000-000000000035', 'Rosemary', 'Salvia rosmarinus', 'Mediterranean', 7, 'Full sun', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000035/seed.jpg')),
    ('10000000-0000-0000-0000-000000000036', 'Spearmint', 'Mentha spicata', 'Europe', 3, 'Partial shade', true, false, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000036/seed.jpg')),
    ('10000000-0000-0000-0000-000000000052', 'Snake plant', 'Dracaena trifasciata', 'West Africa', 14, 'Low to bright indirect', true, true, concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000052/seed.jpg')),
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

-- Unapproved, so the dashboard's species page has something to review. updated_at is when they
-- were submitted.
INSERT INTO species (id, common_name, scientific_name, region, watering_frequency_days, sunlight_needs, is_approved, is_common, submitted_by, updated_at, image_key)
VALUES
    ('10000000-0000-0000-0000-000000000601', 'Olive tree', 'Olea europaea', 'Mediterranean', 14, 'Full sun', false, false, '10000000-0000-0000-0000-000000000105', now() - interval '6 days', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000601/seed.jpg')),
    ('10000000-0000-0000-0000-000000000602', 'Bay laurel', 'Laurus nobilis', 'Mediterranean', 7, 'Full sun', false, false, '10000000-0000-0000-0000-000000000105', now() - interval '4 days', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000602/seed.jpg')),
    ('10000000-0000-0000-0000-000000000603', 'Oleander', 'Nerium oleander', 'Mediterranean', 7, 'Full sun', false, false, '10000000-0000-0000-0000-000000000104', now() - interval '3 days', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000603/seed.jpg')),
    ('10000000-0000-0000-0000-000000000604', 'Common sage', 'Salvia officinalis', 'Mediterranean', 10, 'Full sun', false, false, '10000000-0000-0000-0000-000000000103', now() - interval '2 days', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000604/seed.jpg')),
    ('10000000-0000-0000-0000-000000000605', 'Oregano', 'Origanum vulgare', 'Mediterranean', 10, 'Full sun', false, false, '10000000-0000-0000-0000-000000000103', now() - interval '1 day', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000605/seed.jpg'));

INSERT INTO planters (id, owner_id, name, location_type, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'Living room shelf', 'indoor', now()),
    ('10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'Balcony', 'outdoor', now()),
    ('10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000031', 'Balcony', 'outdoor', now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000031', 'Living room', 'indoor', now() - interval '29 days'),
    ('10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000031', 'Kitchen windowsill', 'indoor', now() - interval '28 days'),
    ('10000000-0000-0000-0000-000000000141', '10000000-0000-0000-0000-000000000001', 'Bedroom window', 'indoor', now()),
    ('10000000-0000-0000-0000-000000000142', '10000000-0000-0000-0000-000000000101', 'Bathroom', 'indoor', now()),
    ('10000000-0000-0000-0000-000000000143', '10000000-0000-0000-0000-000000000101', 'Desk', 'indoor', now()),
    ('10000000-0000-0000-0000-000000000144', '10000000-0000-0000-0000-000000000103', 'Kitchen windowsill', 'indoor', now()),
    ('10000000-0000-0000-0000-000000000145', '10000000-0000-0000-0000-000000000105', 'Greenhouse', 'outdoor', now()),
    ('10000000-0000-0000-0000-000000000146', '10000000-0000-0000-0000-000000000105', 'Porch', 'outdoor', now()),
    ('10000000-0000-0000-0000-000000000147', '10000000-0000-0000-0000-000000000107', 'Sunny shelf', 'indoor', now()),
    ('10000000-0000-0000-0000-000000000148', '10000000-0000-0000-0000-000000000104', 'Balcony', 'outdoor', now());

INSERT INTO plants (id, owner_id, planter_id, species_id, name, is_alive, cause_of_death, light, watering_every_days, notes, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000009', 'George the Monstera', true, NULL, 'bright_indirect', NULL, 'Wipe the leaves once a month. Has a moss pole since spring.', now()),
    ('10000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000010', 'Pothy', true, NULL, NULL, NULL, NULL, now()),
    ('10000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', NULL, '10000000-0000-0000-0000-000000000009', 'Greg''s Monstera', false, 'Underwatering', NULL, NULL, NULL, now()),
    ('10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000032', 'George', true, NULL, 'full_sun', NULL, NULL, now() - interval '27 days'),
    ('10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000033', 'Pinky', true, NULL, 'full_sun', NULL, 'Deadhead the old flowers for more blooms.', now() - interval '26 days'),
    ('10000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000009', 'Monty', true, NULL, 'bright_indirect', NULL, 'Turn a quarter every week so it grows straight.', now() - interval '25 days'),
    ('10000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000034', 'Basil', true, NULL, 'full_sun', NULL, 'Pinch the tops off before it flowers.', now() - interval '24 days'),
    ('10000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000035', 'Rosie', true, NULL, 'full_sun', NULL, NULL, now() - interval '23 days'),
    ('10000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000036', 'Minty', true, NULL, 'partial_shade', NULL, 'Keeps trying to take over the whole windowsill.', now() - interval '22 days'),
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

-- Next watering = last watering + the plant's frequency (WateringSchedule). Just Arrived and
-- Forgotten Fred are never watered, so they count from the day they were added.
INSERT INTO watering_logs (plant_id, watered_by, watered_at)
VALUES
    ('10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', now() - interval '1 days'),
    ('10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000031', now() - interval '2 days'),  -- George: in 2 days
    ('10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000031', now() - interval '6 days'),
    ('10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000031', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000031', now() - interval '2 days'),  -- Pinky: today
    ('10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000031', now() - interval '4 days'),
    ('10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000031', now() - interval '6 days'),
    ('10000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000031', now() - interval '2 days'),  -- Monty: in 5 days
    ('10000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000031', now() - interval '9 days'),
    ('10000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000031', now() - interval '16 days'),
    ('10000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000031', now() - interval '4 days'),  -- Basil: 1 day overdue
    ('10000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000031', now() - interval '7 days'),
    ('10000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000031', now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000031', now() - interval '4 days'),  -- Rosie: in 3 days
    ('10000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000031', now() - interval '11 days'),
    ('10000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000031', now() - interval '18 days'),
    ('10000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000031', now() - interval '2 days'),  -- Minty: tomorrow
    ('10000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000031', now() - interval '5 days'),
    ('10000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000031', now() - interval '8 days'),
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

-- George the Monstera's photo has a fixed id: its post below shows it.
INSERT INTO plant_photos (id, plant_id, uploaded_by, photo_key, taken_at)
VALUES
    ('10000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', concat_ws('/', nullif('${storagePrefix}', ''), 'posts/10000000-0000-0000-0000-000000000001/seed.png'), now() - interval '10 days');

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

-- Every species someone has a plant of, plus a few from plants deleted since.
INSERT INTO discovered_species (user_id, species_id, discovered_at)
SELECT owner_id, species_id, MIN(created_at)
FROM plants
WHERE species_id IS NOT NULL
GROUP BY owner_id, species_id;

INSERT INTO discovered_species (user_id, species_id, discovered_at)
VALUES
    ('10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000131', now() - interval '50 days'),
    ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000123', now() - interval '100 days'),
    ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000128', now() - interval '60 days');

INSERT INTO care_delegation (id, plant_id, delegated_by, delegated_to, status, active_from, active_until)
VALUES
    ('10000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'active', now() - interval '5 days', now() + interval '5 days');

INSERT INTO achievements (id, name, description, icon_url, rarity, trigger_type)
VALUES
    ('10000000-0000-0000-0000-000000000019', 'First Plant', 'Added your first plant.', 'https://placehold.co/100x100?text=Achievement', 'common', 'plant_created'),
    ('10000000-0000-0000-0000-000000000020', 'Green Thumb', 'Kept a plant alive for 30 days.', 'https://placehold.co/100x100?text=Achievement', 'rare', 'plant_survival_30d');

INSERT INTO user_achievements (id, user_id, achievement_id, earned_at)
VALUES
    ('10000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000019', now() - interval '20 days');

INSERT INTO posts (id, user_id, plant_id, photo_id, post_type, body, is_resolved, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000013', NULL, 'question', 'Why are the leaves turning yellow?', false, now() - interval '3 days'),
    ('10000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000016', 'new_photo', 'Look how big George got!', NULL, now() - interval '10 days'),
    ('10000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000015', NULL, 'death', 'Lost my monstera to underwatering. RIP.', NULL, now() - interval '7 days');

INSERT INTO post_comments (id, post_id, author_id, body, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001', 'Probably overwatering, let the soil dry out a bit.', now() - interval '2 days'),
    ('10000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000003', 'George is looking great!', now() - interval '9 days'),
    ('10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000002', 'So sorry for your loss 😢', now() - interval '6 days');

INSERT INTO post_reactions (id, post_id, user_id, emoji, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000002', '💧', now() - interval '9 days');
