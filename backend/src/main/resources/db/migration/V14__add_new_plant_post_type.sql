-- A post the owner can share when they add a plant (FMP-019): "Emma planted Gus the Fern".
ALTER TABLE posts DROP CONSTRAINT chk_posts_post_type;
ALTER TABLE posts ADD CONSTRAINT chk_posts_post_type
    CHECK (post_type IN ('update', 'question', 'photo', 'death', 'new_plant'));
