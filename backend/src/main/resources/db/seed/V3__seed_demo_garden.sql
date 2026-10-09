-- A demo account with a full garden, so the Garden screen has something to show in dev
-- and staging. It can log in: gardener@example.com / password123 (BCrypt hash below).
-- Watering times are relative to now(), so the plants show a mix of "Water today",
-- "Water tomorrow", "Water in N days" and "overdue" whenever the seed is (re)loaded.
INSERT INTO users (id, username, email, password_hash, city)
VALUES
    ('10000000-0000-0000-0000-000000000031', 'gardener', 'gardener@example.com',
     '$2a$10$c.tWA0dZdHz0cEdPT4.J3uDKW9ch4poDQwZyoR2bnZWlZpgd28P8e', 'Deventer');

INSERT INTO user_settings (user_id)
VALUES
    ('10000000-0000-0000-0000-000000000031');

INSERT INTO species (id, common_name, scientific_name, region, watering_frequency_days, sunlight_needs, is_approved)
VALUES
    ('10000000-0000-0000-0000-000000000032', 'Geranium', 'Pelargonium zonale', 'Southern Africa', 4, 'Full sun', true),
    ('10000000-0000-0000-0000-000000000033', 'Petunia', 'Petunia x atkinsiana', 'South America', 2, 'Full sun', true),
    ('10000000-0000-0000-0000-000000000034', 'Sweet basil', 'Ocimum basilicum', 'Tropical Asia', 3, 'Bright direct', true),
    ('10000000-0000-0000-0000-000000000035', 'Rosemary', 'Salvia rosmarinus', 'Mediterranean', 7, 'Full sun', true),
    ('10000000-0000-0000-0000-000000000036', 'Spearmint', 'Mentha spicata', 'Europe', 3, 'Partial shade', true);

INSERT INTO planters (id, owner_id, name, location_type, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000031', 'Balcony', 'outdoor', now() - interval '30 days'),
    ('10000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000031', 'Living room', 'indoor', now() - interval '29 days'),
    ('10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000031', 'Kitchen windowsill', 'indoor', now() - interval '28 days');

INSERT INTO plants (id, owner_id, planter_id, species_id, name, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000032', 'George', now() - interval '27 days'),
    ('10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000033', 'Pinky', now() - interval '26 days'),
    ('10000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000009', 'Monty', now() - interval '25 days'),
    ('10000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000034', 'Basil', now() - interval '24 days'),
    ('10000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000035', 'Rosie', now() - interval '23 days'),
    ('10000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000036', 'Minty', now() - interval '22 days');

-- Next watering = last watering + the species' frequency (see GardenService).
INSERT INTO watering_logs (id, plant_id, watered_by, watered_at)
VALUES
    ('10000000-0000-0000-0000-000000000046', '10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000031', now() - interval '2 days'),  -- George: in 2 days
    ('10000000-0000-0000-0000-000000000047', '10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000031', now() - interval '2 days'),  -- Pinky: today
    ('10000000-0000-0000-0000-000000000048', '10000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000031', now() - interval '2 days'),  -- Monty: in 5 days
    ('10000000-0000-0000-0000-000000000049', '10000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000031', now() - interval '4 days'),  -- Basil: 1 day overdue
    ('10000000-0000-0000-0000-000000000050', '10000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000031', now() - interval '4 days'),  -- Rosie: in 3 days
    ('10000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000031', now() - interval '2 days');  -- Minty: tomorrow
