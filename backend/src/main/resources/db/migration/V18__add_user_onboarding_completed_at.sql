-- When the user finished or skipped the app tour; null while they haven't, so it resumes on
-- their next sign-in. Accounts made before this column already saw the tour (or never had one),
-- so they count as done.
ALTER TABLE users
    ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

UPDATE users SET onboarding_completed_at = created_at;
