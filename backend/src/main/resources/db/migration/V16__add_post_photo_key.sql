-- A question's own photo ("why are my leaves going red?" plus a picture). It's uploaded just
-- for the post, so it isn't part of any plant's growth timeline (photo_id).
ALTER TABLE posts ADD COLUMN photo_key VARCHAR(512);
