ALTER TABLE rate_limits
  ADD COLUMN id uuid DEFAULT uuidv7();

ALTER TABLE rate_limits
  ALTER COLUMN id SET NOT NULL,
  DROP CONSTRAINT rate_limits_pkey,
  ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id),
  ADD CONSTRAINT rate_limits_key_unique UNIQUE (key);