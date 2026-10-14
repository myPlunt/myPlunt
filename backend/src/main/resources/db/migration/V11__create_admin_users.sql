-- Accounts for the admin dashboard. Kept apart from users on purpose: an app account can never
-- become an admin, and admins don't sign in through the app's endpoints. There's no sign-up; the
-- first admin comes from ADMIN_BOOTSTRAP_EMAIL/PASSWORD (AdminBootstrap).
CREATE TABLE admin_users (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                  CITEXT NOT NULL CONSTRAINT uq_admin_users_email UNIQUE,
    display_name           VARCHAR(100) NOT NULL,
    password_hash          VARCHAR(255) NOT NULL,
    -- Lockout after repeated wrong passwords (AdminAuthService).
    failed_login_attempts  INT NOT NULL DEFAULT 0
                               CONSTRAINT chk_admin_users_failed_login_attempts_non_negative CHECK (failed_login_attempts >= 0),
    locked_until           TIMESTAMPTZ,
    last_login_at          TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only a SHA-256 hash of each refresh token is stored, so a leaked table can't be used to sign in.
-- expires_at is fixed at login and carried over on every refresh: a session ends after
-- app.admin.session-ttl-hours however active it is.
CREATE TABLE admin_refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID NOT NULL CONSTRAINT fk_admin_refresh_tokens_admin_id REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL CONSTRAINT uq_admin_refresh_tokens_token_hash UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_admin_refresh_tokens_admin_id ON admin_refresh_tokens (admin_id);
