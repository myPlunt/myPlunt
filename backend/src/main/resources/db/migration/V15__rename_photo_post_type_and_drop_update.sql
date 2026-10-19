-- The post types are now exactly FMP-019's: a new plant, a new photo, a question and a death
-- (achievements come later). "photo" becomes "new_photo" to match "new_plant", and "update"
-- (a text-only note nothing in the app creates) goes; its seed post goes with it, along with
-- its reactions and comments (ON DELETE CASCADE).
ALTER TABLE posts DROP CONSTRAINT chk_posts_post_type;
ALTER TABLE posts DROP CONSTRAINT chk_posts_photo_required_for_photo_type;

DELETE FROM posts WHERE post_type = 'update';
UPDATE posts SET post_type = 'new_photo' WHERE post_type = 'photo';

ALTER TABLE posts ADD CONSTRAINT chk_posts_post_type
    CHECK (post_type IN ('new_plant', 'new_photo', 'question', 'death'));
ALTER TABLE posts ADD CONSTRAINT chk_posts_photo_required_for_photo_type
    CHECK (post_type <> 'new_photo' OR photo_id IS NOT NULL);
