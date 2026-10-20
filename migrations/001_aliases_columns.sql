-- ---------------------------------------------------------------------------
-- 001 — align the `aliases` table with the bot's own schema
--
-- Why this exists
--   base/schema/schema.sql and the bot's code (cogs/server/server.py) read and
--   write a column called `alias`:
--
--       SELECT * FROM aliases WHERE guild_id = $1 AND alias = $2
--       INSERT INTO aliases (guild_id, alias, command) VALUES ($1, $2, $3)
--
--   A database created by an older version of the bot still has the columns
--   `name` and `invoke` instead, with `name` and `invoke` marked NOT NULL.
--   `CREATE TABLE IF NOT EXISTS` never alters an existing table, so the bot's
--   alias commands fail against such a database with
--   "column \"alias\" does not exist".
--
--   This migration adds the column the bot expects, copies the existing rows
--   into it and relaxes the legacy NOT NULL constraints so the bot can insert
--   rows that only set (guild_id, alias, command).
--
-- It is deliberately NOT run by the website. Apply it by hand, after taking a
-- backup, once you have decided the dashboard should manage aliases.
--
-- Rollback
--   DROP INDEX IF EXISTS aliases_guild_id_alias_key;
--   ALTER TABLE aliases DROP COLUMN IF EXISTS alias;
--   UPDATE aliases SET name = alias WHERE name IS NULL;   -- run before DROP
--   ALTER TABLE aliases ALTER COLUMN name SET NOT NULL;
--   ALTER TABLE aliases ALTER COLUMN invoke SET NOT NULL;
-- ---------------------------------------------------------------------------

BEGIN;

-- 1. The column the bot reads and writes.
ALTER TABLE aliases ADD COLUMN IF NOT EXISTS alias TEXT;

-- 2. Copy the legacy values across.
UPDATE aliases SET alias = name WHERE alias IS NULL AND name IS NOT NULL;

-- 3. The bot upserts with ON CONFLICT (guild_id, alias), which needs a
--    unique constraint on that pair.
CREATE UNIQUE INDEX IF NOT EXISTS aliases_guild_id_alias_key
    ON aliases (guild_id, alias)
    WHERE alias IS NOT NULL;

-- 4. The bot inserts (guild_id, alias, command) only, so the legacy columns
--    must stop being mandatory.
ALTER TABLE aliases ALTER COLUMN name DROP NOT NULL;
ALTER TABLE aliases ALTER COLUMN invoke DROP NOT NULL;

COMMIT;
