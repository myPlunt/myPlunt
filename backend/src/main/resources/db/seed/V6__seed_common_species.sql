UPDATE species SET is_common = true
WHERE id IN ('10000000-0000-0000-0000-000000000009',  -- Monstera
             '10000000-0000-0000-0000-000000000032',  -- Geranium
             '10000000-0000-0000-0000-000000000034'); -- Sweet basil

INSERT INTO species (id, common_name, scientific_name, region, watering_frequency_days, sunlight_needs, is_approved, is_common)
VALUES
    ('10000000-0000-0000-0000-000000000052', 'Snake plant', 'Dracaena trifasciata', 'West Africa', 14, 'Low to bright indirect', true, true);
