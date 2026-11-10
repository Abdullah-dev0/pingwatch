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

-- one row per Gemini call: used for the hourly rate limit and the cost display
CREATE TABLE IF NOT EXISTS llm_usage (
  id            SERIAL        PRIMARY KEY,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  kind          TEXT          NOT NULL,  -- 'chat' | 'incident'
  input_tokens  INTEGER       NOT NULL,
  output_tokens INTEGER       NOT NULL,
  cost_usd      NUMERIC(12,8) NOT NULL
);

CREATE INDEX IF NOT EXISTS llm_usage_created_at_idx ON llm_usage (created_at DESC);

-- a ping that took more than 2x the 24h average
CREATE TABLE IF NOT EXISTS incidents (
  id               SERIAL      PRIMARY KEY,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ping_id          INTEGER     NOT NULL REFERENCES ping_results (id) ON DELETE CASCADE,
  endpoint         TEXT        NOT NULL,
  severity         TEXT        NOT NULL,  -- 'low' | 'medium' | 'high'
  response_time_ms INTEGER     NOT NULL,
  average_ms       INTEGER     NOT NULL,
  summary          TEXT        NOT NULL,
  root_causes      JSONB       NOT NULL,  -- string[]
  recommendations  JSONB       NOT NULL,  -- string[]
  generated_by     TEXT        NOT NULL   -- 'llm' | 'template' (template when out of quota or the LLM failed)
);

-- deleting a ping deletes its incidents; re-applied each start so existing databases pick it up
ALTER TABLE incidents
  DROP CONSTRAINT IF EXISTS incidents_ping_id_fkey,
  ADD CONSTRAINT incidents_ping_id_fkey
    FOREIGN KEY (ping_id) REFERENCES ping_results (id) ON DELETE CASCADE;
