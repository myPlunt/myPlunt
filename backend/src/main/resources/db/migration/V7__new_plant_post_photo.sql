-- A new_plant post showed the plant's latest photo, so it changed whenever a photo was added.
-- Pin existing new_plant posts to the plant's first photo taken by the time the post was made.
UPDATE posts p
SET photo_id = (
    SELECT pp.id
    FROM plant_photos pp
    WHERE pp.plant_id = p.plant_id
      AND pp.taken_at <= p.created_at
    ORDER BY pp.taken_at ASC
    LIMIT 1
)
WHERE p.post_type = 'new_plant'
  AND p.photo_id IS NULL;
