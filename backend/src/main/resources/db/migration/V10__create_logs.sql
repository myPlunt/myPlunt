
CREATE TABLE logs (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- The line's "type": error, warning, bug, action or info.
    level      VARCHAR(20) NOT NULL,
    logged_at  TIMESTAMPTZ NOT NULL,
    location   VARCHAR(10) NOT NULL CONSTRAINT chk_logs_location CHECK (location IN ('backend', 'frontend')),
    details    JSONB NOT NULL,
    -- JSON, not JSONB, so the text and key order stay as they were in the file.
    raw        JSON NOT NULL
);

CREATE INDEX idx_logs_logged_at ON logs (logged_at);
CREATE INDEX idx_logs_level_logged_at ON logs (level, logged_at);
