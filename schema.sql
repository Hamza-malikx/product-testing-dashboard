-- Relational schema for the product testing platform.
-- PostgreSQL. Shared catalogue with tiered entitlements: every subscriber
-- sees the same test results, the plan controls how much of them.

CREATE EXTENSION IF NOT EXISTS btree_gist; -- lets the exclusion constraint mix equality with range overlap
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive text, for emails

-- Tenancy and access ---------------------------------------------------

CREATE TABLE organisations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Plans as a lookup table, not an enum: plans change (pricing,
-- grandfathered deals) and a table can carry metadata. The rank column
-- supports "premium or higher" checks.
CREATE TABLE tiers (
  id       smallint PRIMARY KEY,
  code     text NOT NULL UNIQUE,          -- 'basic' | 'premium' | 'enterprise'
  rank     smallint NOT NULL UNIQUE,      -- unique, so "premium or higher" is never ambiguous
  features jsonb NOT NULL DEFAULT '{}'    -- per-plan flags without schema churn
);

-- The subscription is per organisation, because B2B contracts are
-- org-level; users inherit their organisation's plan.
CREATE TABLE subscriptions (
  id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id   uuid NOT NULL REFERENCES organisations(id),
  tier_id  smallint NOT NULL REFERENCES tiers(id),
  validity daterange NOT NULL CHECK (NOT isempty(validity)), -- an empty range overlaps nothing, so it would sneak past the rule below
  -- No overlapping subscriptions per org, so at most one is active at
  -- any moment. The backing index also serves the hottest read in the
  -- system:  WHERE org_id = $1 AND validity @> CURRENT_DATE
  EXCLUDE USING gist (org_id WITH =, validity WITH &&)
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organisations(id),
  -- citext keeps every comparison case-insensitive automatically, so no
  -- query can forget to lower(). v1: one org per user; add a membership
  -- table when that need is real.
  email         citext NOT NULL UNIQUE,
  password_hash text NOT NULL,            -- argon2id
  role          text NOT NULL DEFAULT 'member',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Shared catalogue ------------------------------------------------------

CREATE TABLE categories (
  id   integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE products (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id integer NOT NULL REFERENCES categories(id),
  brand       text NOT NULL,
  model       text NOT NULL,
  UNIQUE (category_id, brand, model)
);

-- Hybrid metrics: the two values every category shares are typed,
-- constrained columns; protocol-specific measurements live in JSONB.
-- Promotion rule: when a JSONB metric becomes filter- or sort-critical,
-- it gets its own column.
CREATE TABLE test_results (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES products(id),
  score      numeric(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  ttr_days   numeric(5,2),                -- time to result, in days
  tested_at  date NOT NULL,
  metrics    jsonb NOT NULL DEFAULT '{}'
);

-- Reports and audit ------------------------------------------------------

CREATE TABLE report_artifacts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id bigint NOT NULL REFERENCES test_results(id),
  storage_key    text NOT NULL,           -- private object key, never a public URL
  min_tier_id    smallint NOT NULL REFERENCES tiers(id)
);

CREATE TABLE download_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES users(id),
  -- org_id is stored on purpose, even though it is derivable from the
  -- user: the audit row must record the org at request time, even if
  -- the user later moves to another organisation.
  org_id       uuid NOT NULL REFERENCES organisations(id),
  artifact_id  uuid NOT NULL REFERENCES report_artifacts(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  allowed      boolean NOT NULL           -- log denials too: they are the security signal
);

-- Indexes ---------------------------------------------------------------

-- Covering index: the latest-scores lookup per product can run as an
-- index-only scan once the table's visibility map is current (Postgres
-- still visits the heap for pages not yet marked all-visible).
CREATE INDEX ON test_results (product_id, tested_at DESC) INCLUDE (score, ttr_days);

-- The dashboard is category-scoped.
CREATE INDEX ON products (category_id);

-- Per-tenant usage and abuse queries, newest first.
CREATE INDEX ON download_log (org_id, requested_at DESC);

-- "Who downloaded this report": Postgres does not auto-index foreign keys.
CREATE INDEX ON download_log (artifact_id);

-- Note: users(email) and the subscription exclusion constraint already
-- create their own indexes. A partial index keyed on today's date is not
-- possible (CURRENT_DATE is not immutable). Modeling "active" as an
-- open-ended range would allow one, but the range plus GiST approach
-- also validates historical date checks and enforces non-overlap in a
-- single object.

-- Row-level security: defense in depth on tenant-owned tables ------------
-- The app sets the org for each transaction:  SET LOCAL app.org_id = '...'
-- RLS deliberately does NOT apply to the shared catalogue, because the
-- catalogue is shared by design; entitlements control it per request.

ALTER TABLE download_log ENABLE ROW LEVEL SECURITY;
-- Owners skip RLS by default, and demo apps often connect as the role
-- that ran the migrations. FORCE applies the policy to the owner too;
-- the app should still connect as a plain role that owns nothing.
ALTER TABLE download_log FORCE ROW LEVEL SECURITY;

-- current_setting(..., true) returns NULL instead of raising when the
-- setting is absent, and NULLIF guards the empty string. A request that
-- forgot SET LOCAL then sees zero rows: it fails closed and quiet.
CREATE POLICY org_isolation ON download_log
  USING (org_id = NULLIF(current_setting('app.org_id', true), '')::uuid);
