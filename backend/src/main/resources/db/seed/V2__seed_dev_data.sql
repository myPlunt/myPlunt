INSERT INTO users (id, username, email, password_hash, avatar_url, city, watering_streak)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'alice', 'alice@example.com', 'hash1', 'https://placehold.co/400x400?text=Avatar', 'Deventer', 3),
    ('10000000-0000-0000-0000-000000000002', 'bob', 'bob@example.com', 'hash2', 'https://placehold.co/1000x1000?text=Avatar', 'Amsterdam', 0),
    ('10000000-0000-0000-0000-000000000003', 'greg', 'greg@example.com', 'hash3', 'https://placehold.co/1000x1000?text=Avatar', 'Amsterdam', 0);

INSERT INTO user_settings (user_id, post_visibility, watering_reminders, weather_alerts, delegation_requests, friend_post_notifications, achievement_notifications)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'public', true, true, true, true, true),
    ('10000000-0000-0000-0000-000000000002', 'public', true, false, true, true, true),
    ('10000000-0000-0000-0000-000000000003', 'private', true, true, false, true, true);

INSERT INTO friendships (id, requester_id, receiver_id, status, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'accepted', now() - interval '45 days'),
    ('10000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'pending', now() - interval '2 days');

INSERT INTO species (id, common_name, scientific_name, region, watering_frequency_days, sunlight_needs, notes, is_approved, submitted_by, approved_by)
VALUES
    ('10000000-0000-0000-0000-000000000009', 'Monstera', 'Monstera deliciosa', 'Central America', 7, 'Indirect', 'Popular houseplant, likes humidity.', true, '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
    ('10000000-0000-0000-0000-000000000010', 'Pothos', 'Epipremnum aureum', 'Southeast Asia', 10, 'Low to bright indirect', 'Very forgiving, good for beginners.', false, '10000000-0000-0000-0000-000000000001', NULL);

INSERT INTO planters (id, owner_id, name, location_type, photo_url)
VALUES
    ('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'Living room shelf', 'indoor', 'https://placehold.co/300x300?text=Planter'),
    ('10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'Balcony', 'outdoor', 'https://placehold.co/300x300?text=Planter');

INSERT INTO plants (id, owner_id, planter_id, species_id, name, is_alive, cause_of_death)
VALUES
    ('10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000009', 'George the Monstera', true, NULL),
    ('10000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000010', 'Pothy', true, NULL),
    ('10000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', NULL, '10000000-0000-0000-0000-000000000009', 'Greg''s Monstera', false, 'Underwatering');

INSERT INTO plant_photos (id, plant_id, uploaded_by, photo_url, taken_at)
VALUES
    ('10000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'https://placehold.co/600x600?text=Plant', now() - interval '10 days');

INSERT INTO watering_logs (id, plant_id, watered_by, watered_at)
VALUES
    ('10000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', now() - interval '1 days');

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

INSERT INTO weather_cache (id, city, fetched_at, temperature_c, humidity_pct, condition, raw_json)
VALUES
    ('10000000-0000-0000-0000-000000000022', 'Deventer', now() - interval '1 hours', 14.5, 78.0, 'Cloudy', '{"source": "seed"}');

INSERT INTO posts (id, user_id, plant_id, photo_id, post_type, body, is_resolved, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000013', NULL, 'question', 'Why are the leaves turning yellow?', false, now() - interval '3 days');

INSERT INTO post_comments (id, post_id, author_id, body, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001', 'Probably overwatering, let the soil dry out a bit.', now() - interval '2 days');

INSERT INTO posts (id, user_id, plant_id, photo_id, post_type, body, is_resolved, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000016', 'photo', 'Look how big George got!', NULL, now() - interval '10 days');

INSERT INTO post_reactions (id, post_id, user_id, emoji, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000002', '💧', now() - interval '9 days');

INSERT INTO post_comments (id, post_id, author_id, body, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000003', 'George is looking great!', now() - interval '9 days');

INSERT INTO posts (id, user_id, plant_id, photo_id, post_type, body, is_resolved, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000013', NULL, 'update', 'Watered George today 💧', NULL, now() - interval '1 days');

INSERT INTO posts (id, user_id, plant_id, photo_id, post_type, body, is_resolved, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000015', NULL, 'death', 'Lost my monstera to underwatering. RIP.', NULL, now() - interval '7 days');

INSERT INTO post_comments (id, post_id, author_id, body, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000002', 'So sorry for your loss 😢', now() - interval '6 days');
