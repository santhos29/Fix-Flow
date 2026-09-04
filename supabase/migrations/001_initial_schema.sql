-- ============================================================
-- FixFlow — Supabase Schema (Migration 001)
-- Run this in Supabase SQL Editor or via supabase db push
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE agent_type AS ENUM ('known', 'mid', 'unknown');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'in_review', 'closed');
CREATE TYPE review_status AS ENUM ('pending_review', 'approved', 'rejected');
CREATE TYPE resolution_action AS ENUM ('auto_resolved', 'human_resolved', 'escalated');

-- ============================================================
-- TABLE: issues
-- Stores every incoming issue + its lifecycle state
-- ============================================================

CREATE TABLE issues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  source            TEXT NOT NULL CHECK (source IN ('webhook', 'email', 'form')),
  agent_type        agent_type,
  similarity_score  FLOAT,           -- Top match score from vector search
  jira_ticket_id    TEXT UNIQUE,     -- e.g. MAINT-42
  jira_ticket_url   TEXT,
  status            ticket_status DEFAULT 'open',
  assigned_to       TEXT,            -- Developer email or name
  tags              TEXT[],
  raw_payload       JSONB,           -- Original intake payload
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  resolved_at       TIMESTAMPTZ
);

-- Index for fast status + agent_type queries (dashboard filters)
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_agent_type ON issues(agent_type);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issues_jira_ticket_id ON issues(jira_ticket_id);

-- ============================================================
-- TABLE: knowledge_base
-- Vector store of known issues + their solutions
-- ============================================================

CREATE TABLE knowledge_base (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_title     TEXT NOT NULL,
  description     TEXT NOT NULL,
  paraphrases     TEXT[],           -- 3-5 alternate phrasings for same issue
  root_cause      TEXT,
  fix_steps       TEXT NOT NULL,    -- Step-by-step resolution (shown in Jira comment)
  assigned_to     TEXT,             -- Default assignee for this issue type
  tags            TEXT[],           -- module, severity, component
  source_issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  review_status   review_status DEFAULT 'pending_review',
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  embedding       VECTOR(1536),     -- text-embedding-3-small output
  use_count       INT DEFAULT 0,    -- Times this KB entry was matched
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- IVFFlat index for fast approximate nearest-neighbor search
-- (Rebuild after adding bulk data: DROP INDEX and recreate with lists = sqrt(row_count))
CREATE INDEX idx_kb_embedding ON knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_kb_review_status ON knowledge_base(review_status);
CREATE INDEX idx_kb_tags ON knowledge_base USING GIN(tags);

-- ============================================================
-- TABLE: resolution_log
-- Audit trail for every ticket resolution
-- ============================================================

CREATE TABLE resolution_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id             UUID REFERENCES issues(id) ON DELETE CASCADE,
  kb_id                UUID REFERENCES knowledge_base(id) ON DELETE SET NULL,
  action               resolution_action NOT NULL,
  resolution_time_mins INT,
  final_comment        TEXT,         -- Extracted Jira closing comment
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resolution_log_issue_id ON resolution_log(issue_id);
CREATE INDEX idx_resolution_log_created_at ON resolution_log(created_at DESC);

-- ============================================================
-- TABLE: test_cases
-- Golden dataset for classifier regression testing
-- ============================================================

CREATE TABLE test_cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  expected_agent      agent_type NOT NULL,
  expected_kb_id      UUID REFERENCES knowledge_base(id) ON DELETE SET NULL,
  expected_assignee   TEXT,
  category            TEXT CHECK (category IN ('exact_known', 'near_known', 'mid_level', 'unknown', 'edge_case')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: regression_results
-- Stores classifier test run results for trend tracking
-- ============================================================

CREATE TABLE regression_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at          TIMESTAMPTZ DEFAULT now(),
  total_cases     INT NOT NULL,
  correct_count   INT NOT NULL,
  accuracy        FLOAT GENERATED ALWAYS AS (correct_count::float / total_cases) STORED,
  details         JSONB,  -- Per-case breakdown: {test_case_id, expected, actual, passed}
  triggered_by    TEXT DEFAULT 'cron' -- 'cron' | 'manual'
);

-- ============================================================
-- TABLE: assignee_module_map
-- Maps software modules/tags to default assignees
-- (Editable from dashboard /settings page)
-- ============================================================

CREATE TABLE assignee_module_map (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_tag  TEXT NOT NULL UNIQUE,   -- e.g. 'auth', 'payments', 'api-gateway'
  assignee    TEXT NOT NULL,           -- Developer email or name
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: system_config
-- Key-value store for tunable thresholds + settings
-- (Editable from dashboard /settings page)
-- ============================================================

CREATE TABLE system_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Default config values
INSERT INTO system_config (key, value, description) VALUES
  ('threshold_known',    '0.85', 'Similarity score above which issue is routed to Known agent'),
  ('threshold_mid_low',  '0.55', 'Similarity score below which issue is routed to Unknown agent'),
  ('max_kb_results',     '3',    'Max KB results to surface as tips for mid-level issues'),
  ('auto_close_enabled', 'true', 'Whether to auto-close tickets for known issues'),
  ('shadow_mode',        'false','If true, agents run but do not write to Jira');

-- ============================================================
-- FUNCTION: match_issues
-- Semantic similarity search against approved KB entries
-- ============================================================

CREATE OR REPLACE FUNCTION match_issues(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.55,
  match_count     INT   DEFAULT 3
)
RETURNS TABLE (
  id          UUID,
  issue_title TEXT,
  fix_steps   TEXT,
  assigned_to TEXT,
  tags        TEXT[],
  similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    issue_title,
    fix_steps,
    assigned_to,
    tags,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE
    review_status = 'approved'
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ============================================================
-- FUNCTION: auto_update_updated_at
-- Trigger to keep updated_at columns current
-- ============================================================

CREATE OR REPLACE FUNCTION auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_issues_timestamp
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();

CREATE TRIGGER update_kb_timestamp
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE regression_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignee_module_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by n8n)
-- Anon key gets read-only access for dashboard (adjust as needed)
CREATE POLICY "Service role full access" ON issues
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon read issues" ON issues
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON knowledge_base
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon read approved KB" ON knowledge_base
  FOR SELECT USING (review_status = 'approved');

CREATE POLICY "Service role full access" ON resolution_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon read resolution_log" ON resolution_log
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON test_cases
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon read test_cases" ON test_cases
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON regression_results
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon read regression_results" ON regression_results
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON assignee_module_map
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon read assignee map" ON assignee_module_map
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON system_config
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon read config" ON system_config
  FOR SELECT USING (true);
