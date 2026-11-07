CREATE TABLE business_settings (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    name VARCHAR(120) NOT NULL DEFAULT '',
    description VARCHAR(1000) NOT NULL DEFAULT '',
    currency CHAR(3) NOT NULL DEFAULT 'ARS',
    primary_color VARCHAR(7) NOT NULL DEFAULT '#176b52',
    whatsapp VARCHAR(20) NOT NULL DEFAULT '',
    minimum_order NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (minimum_order >= 0),
    welcome_message VARCHAR(500) NOT NULL DEFAULT '',
    terms VARCHAR(4000) NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Empty installation settings, not demonstration data or a fixed merchant.
INSERT INTO business_settings (id) VALUES (1);
