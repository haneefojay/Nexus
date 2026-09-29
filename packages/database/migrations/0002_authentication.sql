ALTER TABLE users
  ADD COLUMN email_verified boolean NOT NULL DEFAULT false;

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sessions_token_unique ON sessions (token);
CREATE INDEX sessions_user_expires_idx ON sessions (user_id, expires_at);

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT accounts_provider_account_unique UNIQUE (provider_id, account_id)
);
CREATE INDEX accounts_user_idx ON accounts (user_id);

CREATE TABLE verifications (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verifications_identifier_idx ON verifications (identifier);
CREATE INDEX verifications_expires_idx ON verifications (expires_at);

CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  last_request bigint NOT NULL
);