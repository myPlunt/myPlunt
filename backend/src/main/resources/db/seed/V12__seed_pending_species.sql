-- Mediterranean species users submitted that no admin has approved yet, so the admin dashboard's
-- species page has something to review. is_approved stays false: the app doesn't list them until
-- someone approves them. updated_at is when they were submitted.
INSERT INTO species (id, common_name, scientific_name, region, watering_frequency_days, sunlight_needs, is_approved, is_common, submitted_by, updated_at, image_key)
VALUES
    ('10000000-0000-0000-0000-000000000601', 'Olive tree', 'Olea europaea', 'Mediterranean', 14, 'Full sun', false, false, '10000000-0000-0000-0000-000000000105', now() - interval '6 days', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000601/seed.jpg')),
    ('10000000-0000-0000-0000-000000000602', 'Bay laurel', 'Laurus nobilis', 'Mediterranean', 7, 'Full sun', false, false, '10000000-0000-0000-0000-000000000105', now() - interval '4 days', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000602/seed.jpg')),
    ('10000000-0000-0000-0000-000000000603', 'Oleander', 'Nerium oleander', 'Mediterranean', 7, 'Full sun', false, false, '10000000-0000-0000-0000-000000000104', now() - interval '3 days', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000603/seed.jpg')),
    ('10000000-0000-0000-0000-000000000604', 'Common sage', 'Salvia officinalis', 'Mediterranean', 10, 'Full sun', false, false, '10000000-0000-0000-0000-000000000103', now() - interval '2 days', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000604/seed.jpg')),
    ('10000000-0000-0000-0000-000000000605', 'Oregano', 'Origanum vulgare', 'Mediterranean', 10, 'Full sun', false, false, '10000000-0000-0000-0000-000000000103', now() - interval '1 day', concat_ws('/', nullif('${storagePrefix}', ''), 'species/10000000-0000-0000-0000-000000000605/seed.jpg'));
