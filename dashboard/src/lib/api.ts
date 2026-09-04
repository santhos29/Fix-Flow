import { supabase } from './realtime/supabase'
import type { Incident, KnowledgeEntry, KnowledgeReviewItem, SystemMetrics, WorkflowEvent } from '@/types'

// ── Incidents ──────────────────────────────────────────────
export async function fetchIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return (data || []).map(mapDbRowToIncident)
}

export async function fetchIncidentById(id: string): Promise<Incident | null> {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return mapDbRowToIncident(data)
}

function mapDbRowToIncident(row: Record<string, unknown>): Incident {
  return {
    id: row.id as string,
    title: (row.title || row.summary || 'Untitled Incident') as string,
    description: (row.description || '') as string,
    priority: ((row.priority as string) || 'P3') as Incident['priority'],
    status: ((row.status as string) || 'open') as Incident['status'],
    source: (row.source || 'Unknown') as string,
    service: (row.service || 'Unknown') as string,
    environment: (row.environment || 'production') as string,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
    resolvedAt: row.resolved_at as string | undefined,
    similarity: row.similarity as number | undefined,
    route: row.route as Incident['route'] | undefined,
    jiraKey: row.jira_key as string | undefined,
    jiraUrl: row.jira_url as string | undefined,
    playbookId: row.playbook_id as string | undefined,
    playbookName: row.playbook_name as string | undefined,
    suggestedResolution: row.suggested_resolution as string | undefined,
    verificationPassed: row.verification_passed as boolean | undefined,
    stage: row.stage as Incident['stage'] | undefined,
    mttr: row.mttr as number | undefined,
  }
}

// ── Knowledge Base ──────────────────────────────────────────
export async function fetchKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data || []).map(mapDbRowToKnowledge)
}

export async function fetchKnowledgeById(id: string): Promise<KnowledgeEntry | null> {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return mapDbRowToKnowledge(data)
}

export async function fetchPendingKnowledge(): Promise<KnowledgeReviewItem[]> {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((row: Record<string, unknown>) => ({
    id: (row.id as string),
    draftId: (row.id as string),
    incidentId: (row.incident_id as string) || '',
    incidentTitle: (row.incident_title as string) || 'Unknown Incident',
    problem: (row.problem || row.title || '') as string,
    resolution: (row.resolution || row.solution || '') as string,
    tags: (row.tags as string[]) || [],
    proposedBy: 'resolution_extraction' as const,
    createdAt: (row.created_at as string) || new Date().toISOString(),
  }))
}

export async function approveKnowledge(id: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_base')
    .update({ status: 'active', approved_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function rejectKnowledge(id: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_base')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) throw error
}

function mapDbRowToKnowledge(row: Record<string, unknown>): KnowledgeEntry {
  return {
    id: row.id as string,
    title: (row.title || 'Untitled') as string,
    problem: (row.problem || row.title || '') as string,
    resolution: (row.resolution || row.solution || '') as string,
    tags: (row.tags as string[]) || [],
    status: ((row.status as string) || 'active') as KnowledgeEntry['status'],
    source: ((row.source as string) || 'human') as KnowledgeEntry['source'],
    usageCount: (row.usage_count as number) || 0,
    successRate: row.success_rate as number | undefined,
    approvedBy: row.approved_by as string | undefined,
    approvedAt: row.approved_at as string | undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
    incidentRef: row.incident_id as string | undefined,
  }
}

// ── Workflow Events ─────────────────────────────────────────
export async function fetchWorkflowEvents(incidentId?: string, limit = 50): Promise<WorkflowEvent[]> {
  let query = supabase
    .from('workflow_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (incidentId) query = query.eq('incident_id', incidentId)

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    incidentId: row.incident_id as string,
    eventType: row.event_type as string,
    stage: (row.stage as string) || '',
    message: (row.message as string) || '',
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: (row.created_at as string) || new Date().toISOString(),
  }))
}

// ── Metrics ─────────────────────────────────────────────────
export async function fetchLiveStats() {
  const [incidentsRes, knowledgeRes] = await Promise.all([
    supabase.from('issues').select('id, status, mttr, route, resolved_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('knowledge_base').select('id, status').eq('status', 'active'),
  ])

  const incidents = incidentsRes.data || []
  const knowledge = knowledgeRes.data || []

  const today = new Date().toDateString()
  const resolved = incidents.filter(i => i.status === 'resolved' || i.status === 'closed')
  const autoResolvedToday = incidents.filter(i => {
    const isAuto = i.route === 'known' && (i.status === 'resolved' || i.status === 'closed')
    const isToday = i.resolved_at ? new Date(i.resolved_at).toDateString() === today : false
    return isAuto && isToday
  })

  const mttrValues = resolved.filter(i => i.mttr).map(i => i.mttr as number)
  const avgMttr = mttrValues.length > 0 ? Math.round(mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length) : 0

  const known = incidents.filter(i => i.route === 'known').length
  const mid = incidents.filter(i => i.route === 'mid').length
  const unknown = incidents.filter(i => i.route === 'unknown').length
  const total = incidents.length

  return {
    activeIncidents: incidents.filter(i => i.status === 'open' || i.status === 'in_progress').length,
    autoResolvedToday: autoResolvedToday.length,
    avgMttrMinutes: avgMttr,
    totalKnowledgeEntries: knowledge.length,
    systemStatus: 'operational' as const,
    routingDistribution: {
      known: total > 0 ? Math.round((known / total) * 100) : 0,
      mid: total > 0 ? Math.round((mid / total) * 100) : 0,
      unknown: total > 0 ? Math.round((unknown / total) * 100) : 0,
    },
  }
}
