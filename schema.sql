-- somi-full-template — booking/payments website schema (v1)
-- Per-client D1. In production this is somi-db-{ulid}; in dev it's the
-- standalone `somi-full-template` D1. These tables are seeded alongside the
-- Somi operational tables at signup.

CREATE TABLE IF NOT EXISTS customers (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT NOT NULL,
  address             TEXT,
  notes               TEXT,
  stripe_customer_id  TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE COLLATE NOCASE,
  type          TEXT NOT NULL,                 -- percent_off | fixed_off | free_clean
  value         INTEGER NOT NULL DEFAULT 0,    -- percent (0-100) or cents
  max_uses      INTEGER,
  current_uses  INTEGER NOT NULL DEFAULT 0,
  expires_at    TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL UNIQUE,            -- YYYY-MM-DD
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id            TEXT PRIMARY KEY DEFAULT 'global',
  capacity_cap  INTEGER NOT NULL DEFAULT 8,
  updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id                        TEXT PRIMARY KEY,
  customer_id               TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  service                   TEXT NOT NULL,
  home_size                 TEXT NOT NULL,
  date                      TEXT NOT NULL,           -- YYYY-MM-DD
  time                      TEXT NOT NULL,           -- HH:MM (24h)
  estimated_hours           REAL NOT NULL DEFAULT 2.0,
  add_ons                   TEXT NOT NULL DEFAULT '[]',
  notes                     TEXT,
  base_price                INTEGER NOT NULL DEFAULT 0,    -- cents
  add_on_total              INTEGER NOT NULL DEFAULT 0,    -- cents
  discount_pct              REAL NOT NULL DEFAULT 0,
  total                     INTEGER NOT NULL DEFAULT 0,    -- cents
  status                    TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | cancelled
  stripe_payment_intent_id  TEXT,
  promo_code_id             TEXT REFERENCES promo_codes(id) ON DELETE SET NULL,
  created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id                        TEXT PRIMARY KEY,
  customer_id               TEXT NOT NULL REFERENCES customers(id),
  booking_id                TEXT REFERENCES bookings(id),
  type                      TEXT NOT NULL,           -- charge | refund
  amount                    INTEGER NOT NULL,        -- cents
  currency                  TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id  TEXT,
  stripe_refund_id          TEXT,
  description               TEXT,
  status                    TEXT NOT NULL DEFAULT 'succeeded',
  created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_pi          ON bookings(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date   ON blocked_dates(date);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON transactions(booking_id);

INSERT OR IGNORE INTO settings (id, capacity_cap, updated_at)
VALUES ('global', 8, strftime('%Y-%m-%dT%H:%M:%SZ','now'));
