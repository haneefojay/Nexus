CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

DO $$
BEGIN
  IF current_setting('server_version_num')::integer < 180000 THEN
    RAISE EXCEPTION 'NEXUS requires PostgreSQL 18 or newer';
  END IF;
END
$$;