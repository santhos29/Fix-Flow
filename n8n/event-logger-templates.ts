// ============================================================
// FixFlow n8n Event Logger — HTTP Request Node Template
//
// Add this as an "HTTP Request" node in your n8n workflow
// after each major stage. Copy and paste the JSON body
// expression into the "Body" field of each node.
// ============================================================

// Supabase REST endpoint (no authentication — uses anon key from header)
// URL: https://skbbmddylglzcujgajqw.supabase.co/rest/v1/workflow_events
// Method: POST
// Headers:
//   apikey: <SUPABASE_ANON_KEY>
//   Authorization: Bearer <SUPABASE_ANON_KEY>
//   Content-Type: application/json
//   Prefer: return=minimal

// ── Stage 1: INCIDENT RECEIVED (after Webhook Trigger) ──────
const INTAKE_EVENT = {
  "incident_id": "{{ $json.incident_key ?? $json.id ?? $runId }}",
  "event_type": "INCIDENT_RECEIVED",
  "stage": "intake",
  "status": "completed",
  "message": "Incident received and normalized",
  "metadata": {
    "title": "{{ $json.title }}",
    "source": "{{ $json.source ?? 'webhook' }}",
    "description": "{{ $json.description?.slice(0, 200) }}"
  }
}

// ── Stage 2: EMBEDDING GENERATED (after OpenAI Embeddings) ──
const EMBEDDING_EVENT = {
  "incident_id": "{{ $json.incident_key ?? $node['Webhook'].json.id }}",
  "event_type": "EMBEDDING_GENERATED",
  "stage": "semantic",
  "status": "completed",
  "message": "1536-dimension embedding generated via text-embedding-3-small",
  "metadata": {
    "model": "text-embedding-3-small",
    "dimensions": 1536
  }
}

// ── Stage 3: KNOWLEDGE MATCH FOUND (after pgvector search) ──
const KNOWLEDGE_EVENT = {
  "incident_id": "{{ $json.incident_key ?? $node['Webhook'].json.id }}",
  "event_type": "KNOWLEDGE_MATCH_FOUND",
  "stage": "knowledge",
  "status": "completed",
  "message": "Knowledge base search completed",
  "metadata": {
    "similarity": "{{ $json.similarity ?? $json.best_match_score }}",
    "knowledge_id": "{{ $json.knowledge_id ?? $json.matched_id }}",
    "match_count": "{{ $json.matches?.length ?? 0 }}"
  }
}

// ── Stage 4: ROUTING DECISION (after similarity threshold check) ──
const ROUTING_EVENT = {
  "incident_id": "{{ $json.incident_key ?? $node['Webhook'].json.id }}",
  "event_type": "ROUTING_DECISION",
  "stage": "routing",
  "status": "completed",
  "message": "Incident routed to {{ $json.route }} path",
  "metadata": {
    "route": "{{ $json.route ?? $json.classification }}",
    "similarity": "{{ $json.similarity }}",
    "threshold_known": 0.85,
    "threshold_mid": 0.55
  }
}

// ── Stage 5a: PLAYBOOK COMPLETED (Known route — after Jira close) ──
const PLAYBOOK_DONE_EVENT = {
  "incident_id": "{{ $json.incident_key ?? $node['Webhook'].json.id }}",
  "event_type": "PLAYBOOK_COMPLETED",
  "stage": "automation",
  "status": "completed",
  "message": "Playbook executed and verified successfully",
  "metadata": {
    "jira_ticket": "{{ $json.jira_ticket_id }}",
    "resolution_time_ms": "{{ Date.now() - $node['Webhook'].json.received_at }}"
  }
}

// ── Stage 5b: AI DIAGNOSIS COMPLETED (Unknown route) ──────────
const AI_DIAGNOSIS_EVENT = {
  "incident_id": "{{ $json.incident_key ?? $node['Webhook'].json.id }}",
  "event_type": "AI_DIAGNOSIS_COMPLETED",
  "stage": "diagnosis",
  "status": "completed",
  "message": "LLM diagnostic analysis completed",
  "metadata": {
    "model": "{{ $env.OPENAI_MODEL ?? 'gpt-4o' }}",
    "root_cause": "{{ $json.ai_root_cause?.slice(0, 200) }}"
  }
}

// ── Stage 6: INCIDENT RESOLVED ───────────────────────────────
const RESOLVED_EVENT = {
  "incident_id": "{{ $json.incident_key ?? $node['Webhook'].json.id }}",
  "event_type": "INCIDENT_RESOLVED",
  "stage": "resolution",
  "status": "completed",
  "message": "Incident successfully resolved",
  "metadata": {
    "jira_ticket": "{{ $json.jira_ticket_id }}",
    "route": "{{ $json.route }}"
  }
}

export { INTAKE_EVENT, EMBEDDING_EVENT, KNOWLEDGE_EVENT, ROUTING_EVENT, PLAYBOOK_DONE_EVENT, AI_DIAGNOSIS_EVENT, RESOLVED_EVENT }
