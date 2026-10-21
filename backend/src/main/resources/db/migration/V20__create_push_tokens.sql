-- One row per phone that allows notifications. The token is the key, so a phone that signs in
-- with another account moves to that account instead of notifying both. time_zone is the phone's
-- own, so watering reminders arrive in the morning wherever the user is.
CREATE TABLE push_tokens (
    token       VARCHAR(255) PRIMARY KEY,
    user_id     UUID NOT NULL CONSTRAINT fk_push_tokens_user_id REFERENCES users(id) ON DELETE CASCADE,
    time_zone   VARCHAR(64) NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
