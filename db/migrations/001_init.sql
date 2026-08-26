-- Big Night: accounts, plans, and the content library.
--
-- Run with `npm run db:migrate`. Every statement is written to be safe to run
-- again, because the alternative is a migration you're frightened of.

-- gen_random_uuid() has been core since Postgres 13, so no extension is
-- needed. Requiring pgcrypto would also mean requiring the privilege to
-- install it, which a managed database doesn't always give you.

/* ------------------------------------------------------------------ auth.js
 * These four tables and their exact column names are dictated by
 * @auth/pg-adapter — it writes `INSERT INTO users (name, email, ...)` with no
 * id, so `id` must have a default, and the quoted camelCase columns are what
 * its queries look for. Don't rename anything here without reading that
 * package first.
 */
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  email         TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image         TEXT,

  -- Ours. A plan is a fact about a person, so it lives on the person.
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  -- NULL means "no end date" — a comped account rather than a lapsed one.
  plan_expires_at TIMESTAMPTZ,
  -- Where the current plan came from: 'signup', 'admin', later 'stripe'.
  plan_source   TEXT NOT NULL DEFAULT 'signup',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  id_token            TEXT,
  scope               TEXT,
  session_state       TEXT,
  token_type          TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL,
  "sessionToken" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  token      TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

/* ----------------------------------------------------------------- library
 * Written content, kept so the second person to ask for "90s cartoons" gets an
 * instant board instead of a model bill and a ninety-second wait.
 *
 * One table for boards and prompt packs alike: game_type tells them apart and
 * content_json is whatever that game's engine already understands, so nothing
 * downstream can tell a library board from a freshly written one.
 */
CREATE TABLE IF NOT EXISTS boards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type        TEXT NOT NULL,
  -- The theme after normalising: lowercased, de-fillered, sorted. What
  -- "90s Cartoons" and "cartoons, 90s" both collapse to.
  theme_normalized TEXT NOT NULL,
  -- What the host actually typed, kept for display and for debugging matches.
  theme_original   TEXT NOT NULL DEFAULT '',
  difficulty       TEXT NOT NULL DEFAULT 'medium',
  content_json     JSONB NOT NULL,

  /* Personal content — names, roasts, inside jokes — is stored but never
   * served to anybody but its author. Judged by the model in the same call
   * that writes the content, so it costs nothing extra.
   */
  is_personal      BOOLEAN NOT NULL DEFAULT false,
  -- Who wrote it. Either a signed-in user or a cookie'd anonymous host; a
  -- personal board is only ever served back to whichever of these made it.
  author_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  author_anon_id   TEXT,

  times_served     INTEGER NOT NULL DEFAULT 0,
  times_completed  INTEGER NOT NULL DEFAULT 0,
  skip_count       INTEGER NOT NULL DEFAULT 0,
  -- Soft retirement. Set when a board is skipped too often to keep serving;
  -- never deleted, because the reason it's bad is worth reading later.
  retired_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The hot path: "a non-personal, non-retired <game> board about <theme>".
CREATE INDEX IF NOT EXISTS boards_lookup
  ON boards (game_type, theme_normalized, difficulty)
  WHERE is_personal = false AND retired_at IS NULL;

-- The other hot path: a host's own personal boards.
CREATE INDEX IF NOT EXISTS boards_author_user ON boards (author_user_id)
  WHERE author_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS boards_author_anon ON boards (author_anon_id)
  WHERE author_anon_id IS NOT NULL;

/* Nobody should be served the same board twice. Hosts are either a signed-in
 * user or a cookie, so exactly one of these two columns is set.
 */
CREATE TABLE IF NOT EXISTS seen_boards (
  board_id  UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_id   TEXT,
  seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, anon_id) = 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS seen_by_user
  ON seen_boards (user_id, board_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS seen_by_anon
  ON seen_boards (anon_id, board_id) WHERE anon_id IS NOT NULL;

/* How many boards a free host has had written for them tonight. Counted here
 * rather than in memory so it survives the restart it's meant to outlive.
 */
CREATE TABLE IF NOT EXISTS generation_log (
  id        BIGSERIAL PRIMARY KEY,
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_id   TEXT,
  game_type TEXT NOT NULL,
  at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_by_user ON generation_log (user_id, at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS generation_by_anon ON generation_log (anon_id, at DESC)
  WHERE anon_id IS NOT NULL;
