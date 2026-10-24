-- The last good OpenWeather forecast per town (lat,lon rounded to 2 decimals), so weather alerts and
-- visuals can fall back on it when the API fails, also after a restart.
CREATE TABLE weather_forecasts (
    town        VARCHAR(32) PRIMARY KEY,
    steps       JSONB NOT NULL,
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
