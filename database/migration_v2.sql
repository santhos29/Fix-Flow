-- ============================================================
-- FixFlow Complete Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. workflow_events (event bridge for Realtime UI)
create table if not exists workflow_events (
    id uuid primary key default gen_random_uuid(),
    incident_id text not null,
    event_type text not null,
    stage text not null,
    status text not null default 'completed',
    message text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);
create index if not exists workflow_events_incident_id_idx on workflow_events(incident_id);
create index if not exists workflow_events_created_at_idx on workflow_events(created_at desc);
create index if not exists workflow_events_stage_idx on workflow_events(stage);

-- IMPORTANT: Enable Realtime on this table in Supabase Dashboard

-- 2. playbooks
create table if not exists playbooks (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    risk_level text default 'low' check (risk_level in ('low','medium','high')),
    version text default '1.0',
    status text default 'active' check (status in ('active','disabled','draft')),
    steps jsonb default '[]'::jsonb,
    verification jsonb default '{}'::jsonb,
    rollback jsonb default '{}'::jsonb,
    owner text,
    usage_count int default 0,
    success_count int default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. playbook_executions
create table if not exists playbook_executions (
    id uuid primary key default gen_random_uuid(),
    playbook_id uuid references playbooks(id),
    incident_id text not null,
    status text default 'running' check (status in ('running','completed','failed','rolled_back')),
    steps_completed jsonb default '[]'::jsonb,
    result jsonb default '{}'::jsonb,
    error text,
    started_at timestamptz default now(),
    completed_at timestamptz
);

-- ============================================================
-- Seed: 5 demo playbooks
-- ============================================================

insert into playbooks (name, description, risk_level, version, steps, owner, usage_count, success_count) values
(
  'Restart Connection Pool',
  'Safely drains and restarts the database connection pool service to resolve connection exhaustion incidents.',
  'low', '1.2',
  '[
    {"id":1,"name":"Check connection pool status","type":"health_check","timeout":30},
    {"id":2,"name":"Drain active connections","type":"service_action","timeout":60},
    {"id":3,"name":"Restart pool service","type":"service_restart","timeout":45},
    {"id":4,"name":"Wait for connections to stabilize","type":"wait","duration":15},
    {"id":5,"name":"Verify error rate below threshold","type":"metric_check","threshold":0.01}
  ]',
  'platform-team', 18, 17
),
(
  'Clear Application Cache',
  'Purges Redis cache layers to resolve stale-data and cache-poisoning incidents.',
  'low', '1.0',
  '[
    {"id":1,"name":"Check cache hit rate","type":"metric_check","threshold":0.1},
    {"id":2,"name":"Flush Redis cache","type":"shell_command","command":"redis-cli FLUSHDB"},
    {"id":3,"name":"Warm up critical cache keys","type":"http_request","method":"POST"},
    {"id":4,"name":"Verify response times","type":"metric_check","threshold":200}
  ]',
  'backend-team', 31, 30
),
(
  'Scale Payment Service',
  'Horizontally scales the payment microservice to handle traffic spikes. Requires human approval due to cost impact.',
  'medium', '2.1',
  '[
    {"id":1,"name":"Check current replica count","type":"metric_check"},
    {"id":2,"name":"Verify CPU and memory pressure","type":"metric_check","threshold":0.8},
    {"id":3,"name":"Human approval gate","type":"human_approval","approver":"platform-lead"},
    {"id":4,"name":"Scale replicas to target","type":"service_action","target_replicas":5},
    {"id":5,"name":"Wait for pods to become ready","type":"wait","duration":30},
    {"id":6,"name":"Verify p95 latency","type":"metric_check","threshold":500}
  ]',
  'platform-team', 7, 6
),
(
  'Rotate SSL Certificate',
  'Rotates an expiring SSL certificate across load balancers. High risk — requires explicit approval.',
  'high', '1.0',
  '[
    {"id":1,"name":"Validate new certificate","type":"health_check"},
    {"id":2,"name":"Backup current certificate","type":"shell_command"},
    {"id":3,"name":"Human approval gate","type":"human_approval","approver":"security-lead"},
    {"id":4,"name":"Deploy new certificate","type":"service_action"},
    {"id":5,"name":"Verify TLS handshake","type":"health_check"},
    {"id":6,"name":"Monitor error rate for 5 minutes","type":"wait","duration":300}
  ]',
  'security-team', 3, 3
),
(
  'Restart API Gateway',
  'Performs a rolling restart of the API gateway pods to resolve gateway-level errors.',
  'medium', '1.1',
  '[
    {"id":1,"name":"Check gateway health endpoints","type":"health_check"},
    {"id":2,"name":"Enable maintenance mode","type":"http_request","method":"POST"},
    {"id":3,"name":"Rolling restart pods","type":"service_restart","strategy":"rolling"},
    {"id":4,"name":"Disable maintenance mode","type":"http_request","method":"DELETE"},
    {"id":5,"name":"Verify 5xx error rate","type":"metric_check","threshold":0.005}
  ]',
  'platform-team', 12, 11
);
