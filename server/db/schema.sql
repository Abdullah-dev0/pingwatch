-- one row per ping, failed ones included

CREATE TABLE IF NOT EXISTS ping_results (
  id               SERIAL      PRIMARY KEY,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ok               BOOLEAN     NOT NULL,
  status_code      INTEGER,               -- null on timeout / network error
  response_time_ms INTEGER     NOT NULL,
  request_payload  JSONB       NOT NULL,
  response_body    JSONB,
  error            TEXT
);

CREATE INDEX IF NOT EXISTS ping_results_created_at_idx ON ping_results (created_at DESC);
