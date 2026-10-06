-- This is for case-insensitive unique text (username/email)
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username          CITEXT NOT NULL CONSTRAINT uq_users_username UNIQUE,
    email             CITEXT NOT NULL CONSTRAINT uq_users_email UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    avatar_url        TEXT,
    city              VARCHAR(255),
    bio               VARCHAR(255),
    watering_streak   INT NOT NULL DEFAULT 0 CONSTRAINT chk_users_watering_streak_non_negative CHECK (watering_streak >= 0),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
    user_id                      UUID PRIMARY KEY
                                     CONSTRAINT fk_user_settings_user_id REFERENCES users(id) ON DELETE CASCADE,
    post_visibility              VARCHAR(255) NOT NULL DEFAULT 'public'
                                     CONSTRAINT chk_user_settings_post_visibility CHECK (post_visibility IN ('public', 'private')),
    watering_reminders           BOOLEAN NOT NULL DEFAULT true,
    weather_alerts               BOOLEAN NOT NULL DEFAULT true,
    delegation_requests          BOOLEAN NOT NULL DEFAULT true,
    friend_post_notifications    BOOLEAN NOT NULL DEFAULT true,
    achievement_notifications    BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE friendships (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id  UUID NOT NULL CONSTRAINT fk_friendships_requester_id REFERENCES users(id) ON DELETE CASCADE,
    receiver_id   UUID NOT NULL CONSTRAINT fk_friendships_receiver_id REFERENCES users(id) ON DELETE CASCADE,
    status        VARCHAR(255) NOT NULL DEFAULT 'pending'
                      CONSTRAINT chk_friendships_status CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_friendships_no_self_friend CHECK (requester_id <> receiver_id)
);

CREATE UNIQUE INDEX uq_friendships_unordered_pair
    ON friendships (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));

CREATE TABLE species (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    common_name               VARCHAR(255) NOT NULL,
    scientific_name           VARCHAR(255) NOT NULL CONSTRAINT uq_species_scientific_name UNIQUE,
    region                    VARCHAR(255),
    watering_frequency_days   INT CONSTRAINT chk_species_watering_frequency_positive CHECK (watering_frequency_days > 0),
    sunlight_needs            VARCHAR(255),
    notes                     TEXT,
    is_approved               BOOLEAN NOT NULL DEFAULT false,
    submitted_by              UUID CONSTRAINT fk_species_submitted_by REFERENCES users(id) ON DELETE SET NULL,
    approved_by               UUID CONSTRAINT fk_species_approved_by REFERENCES users(id) ON DELETE SET NULL,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planters (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id       UUID NOT NULL CONSTRAINT fk_planters_owner_id REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    location_type  VARCHAR(255),
    photo_url      TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE plants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id         UUID NOT NULL CONSTRAINT fk_plants_owner_id REFERENCES users(id) ON DELETE CASCADE,
    planter_id       UUID CONSTRAINT fk_plants_planter_id REFERENCES planters(id) ON DELETE SET NULL,
    species_id       UUID CONSTRAINT fk_plants_species_id REFERENCES species(id) ON DELETE SET NULL,
    name             VARCHAR(255) NOT NULL,
    is_alive         BOOLEAN NOT NULL DEFAULT true,
    cause_of_death   VARCHAR(255),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_plants_alive_has_no_cause CHECK (NOT is_alive OR cause_of_death IS NULL)
);

CREATE TABLE plant_photos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id      UUID NOT NULL CONSTRAINT fk_plant_photos_plant_id REFERENCES plants(id) ON DELETE CASCADE,
    uploaded_by   UUID CONSTRAINT fk_plant_photos_uploaded_by REFERENCES users(id) ON DELETE SET NULL,
    photo_url     TEXT NOT NULL,
    taken_at      TIMESTAMPTZ
);

CREATE TABLE watering_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id     UUID NOT NULL CONSTRAINT fk_watering_logs_plant_id REFERENCES plants(id) ON DELETE CASCADE,
    watered_by   UUID CONSTRAINT fk_watering_logs_watered_by REFERENCES users(id) ON DELETE SET NULL,
    watered_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE care_delegation (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id       UUID NOT NULL CONSTRAINT fk_care_delegation_plant_id REFERENCES plants(id) ON DELETE CASCADE,
    delegated_by   UUID NOT NULL CONSTRAINT fk_care_delegation_delegated_by REFERENCES users(id) ON DELETE CASCADE,
    delegated_to   UUID NOT NULL CONSTRAINT fk_care_delegation_delegated_to REFERENCES users(id) ON DELETE CASCADE,
    status         VARCHAR(255) NOT NULL DEFAULT 'pending'
                       CONSTRAINT chk_care_delegation_status CHECK (status IN ('pending', 'active', 'ended', 'declined')),
    active_from    TIMESTAMPTZ,
    active_until   TIMESTAMPTZ,
    CONSTRAINT chk_care_delegation_no_self_delegate CHECK (delegated_by <> delegated_to),
    CONSTRAINT chk_care_delegation_active_window CHECK (active_from < active_until),
    CONSTRAINT chk_care_delegation_active_has_window
        CHECK (status <> 'active' OR (active_from IS NOT NULL AND active_until IS NOT NULL))
);

CREATE UNIQUE INDEX uq_care_delegation_live_plant_delegate
    ON care_delegation (plant_id, delegated_to)
    WHERE status IN ('pending', 'active');

CREATE TABLE achievements (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(255) NOT NULL CONSTRAINT uq_achievements_name UNIQUE,
    description    TEXT,
    icon_url       TEXT,
    rarity         VARCHAR(255) NOT NULL CONSTRAINT chk_achievements_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    trigger_type   VARCHAR(255) NOT NULL
);

CREATE TABLE user_achievements (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL CONSTRAINT fk_user_achievements_user_id REFERENCES users(id) ON DELETE CASCADE,
    achievement_id   UUID NOT NULL CONSTRAINT fk_user_achievements_achievement_id REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_achievements_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE TABLE weather_cache (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city           VARCHAR(255) NOT NULL CONSTRAINT uq_weather_cache_city UNIQUE,
    fetched_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    temperature_c  REAL,
    humidity_pct   REAL CONSTRAINT chk_weather_cache_humidity_range CHECK (humidity_pct BETWEEN 0 AND 100),
    condition      VARCHAR(255),
    raw_json       JSONB
);

CREATE TABLE posts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL CONSTRAINT fk_posts_user_id REFERENCES users(id) ON DELETE CASCADE,
    plant_id      UUID CONSTRAINT fk_posts_plant_id REFERENCES plants(id) ON DELETE CASCADE,
    photo_id      UUID CONSTRAINT fk_posts_photo_id REFERENCES plant_photos(id) ON DELETE CASCADE,
    post_type     VARCHAR(255) NOT NULL
                      CONSTRAINT chk_posts_post_type CHECK (post_type IN ('update', 'question', 'photo', 'death')),
    body          TEXT,
    is_resolved   BOOLEAN,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_posts_is_resolved_only_for_question
        CHECK ((post_type = 'question') = (is_resolved IS NOT NULL)),
    CONSTRAINT chk_posts_photo_required_for_photo_type
        CHECK (post_type <> 'photo' OR photo_id IS NOT NULL)
);

CREATE TABLE post_reactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL CONSTRAINT fk_post_reactions_post_id REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL CONSTRAINT fk_post_reactions_user_id REFERENCES users(id) ON DELETE CASCADE,
    emoji           VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_post_reactions_post_user UNIQUE (post_id, user_id)
);

CREATE TABLE post_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL CONSTRAINT fk_post_comments_post_id REFERENCES posts(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL CONSTRAINT fk_post_comments_author_id REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_friendships_requester_id ON friendships(requester_id);
CREATE INDEX idx_friendships_receiver_id_status ON friendships(receiver_id, status);
CREATE INDEX idx_species_submitted_by ON species(submitted_by);
CREATE INDEX idx_species_approved_by ON species(approved_by);
CREATE INDEX idx_planters_owner_id ON planters(owner_id);
CREATE INDEX idx_plants_owner_id ON plants(owner_id);
CREATE INDEX idx_plants_planter_id ON plants(planter_id);
CREATE INDEX idx_plants_species_id ON plants(species_id);
CREATE INDEX idx_plant_photos_plant_id ON plant_photos(plant_id);
CREATE INDEX idx_plant_photos_uploaded_by ON plant_photos(uploaded_by);
CREATE INDEX idx_watering_logs_plant_id_watered_at ON watering_logs(plant_id, watered_at DESC);
CREATE INDEX idx_watering_logs_watered_by ON watering_logs(watered_by);
CREATE INDEX idx_care_delegation_plant_id ON care_delegation(plant_id);
CREATE INDEX idx_care_delegation_delegated_by ON care_delegation(delegated_by);
CREATE INDEX idx_care_delegation_delegated_to ON care_delegation(delegated_to);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_posts_user_id_created_at ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_plant_id ON posts(plant_id);
CREATE INDEX idx_posts_photo_id ON posts(photo_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX idx_post_comments_post_id_created_at ON post_comments(post_id, created_at);
CREATE INDEX idx_post_comments_author_id ON post_comments(author_id);