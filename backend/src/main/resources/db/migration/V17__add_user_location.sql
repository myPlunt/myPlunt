-- Coordinates for the city users share during onboarding (users.city exists since V1), for
-- weather alerts later. They come from a low-accuracy reading: they place the city, not the home.
ALTER TABLE users
    ADD COLUMN latitude  DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;
