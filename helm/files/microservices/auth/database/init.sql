CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('patient', 'nutritionist', 'admin');

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar UNIQUE NOT NULL,
    "passwordHash" varchar NOT NULL,
    role user_role NOT NULL DEFAULT 'nutritionist',
    active boolean DEFAULT false,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

INSERT INTO users (id, email, "passwordHash", role, active)
VALUES (
    '7d6e9968-b4db-4b35-8e67-75134632b9f9',
    'admin@questnutri.com',
    '$2a$12$g3vY5o2bbLqsKyzRBh/9yO1HfsZwDfgAN9ON1jQzBgfoKDYWOOaUi',
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;