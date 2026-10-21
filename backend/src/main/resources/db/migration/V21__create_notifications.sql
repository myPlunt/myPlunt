-- Every notification sent to a user, for the list behind the bell in the profile's menu. Saved
-- whether or not a phone got it, so a user without push still sees what happened. url is the
-- app route a tap opens.
CREATE TABLE notifications (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL CONSTRAINT fk_notifications_user_id REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    body        VARCHAR(500) NOT NULL,
    url         VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
