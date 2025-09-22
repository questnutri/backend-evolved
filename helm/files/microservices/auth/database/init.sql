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

INSERT INTO users (email, "passwordHash", role, active)
VALUES (
    'admin@questnutri.com',
    crypt('questnutri', gen_salt('bf')),
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;