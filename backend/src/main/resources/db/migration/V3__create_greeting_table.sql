CREATE TABLE greeting (
    id BIGSERIAL PRIMARY KEY,
    message VARCHAR(255) NOT NULL
);

INSERT INTO greeting (message) VALUES ('Hello!');
