'use client'
import { useOperationsStore } from '@/store/operations-store'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { StationId } from '@/types'
import { Cpu, Brain, Search, GitBranch, Zap, Bot, ShieldCheck, CheckCircle, BookOpen } from 'lucide-react'

const STATION_DETAIL: Record<StationId, {
  icon: React.ElementType
  label: string
  detail: string
  techDetail: string
}> = {
  intake:           { icon: Cpu,         label: 'Incident Intake',       detail: 'Receives incident webhooks via POST /fixflow/intake. Validates schema, normalizes payload, and enqueues for processing.', techDetail: 'n8n webhook node → schema validation → Supabase insert' },
  semantic:         { icon: Brain,       label: 'Semantic Engine',        detail: 'Generates 1536-dimension embeddings using OpenAI text-embedding-3-large. Each incident is converted to a dense vector representation.', techDetail: 'OpenAI text-embedding-3-large → 1536-dim vector → Supabase pgvector' },
  knowledge_search: { icon: Search,      label: 'Knowledge Search',       detail: 'Performs cosine similarity search across the pgvector knowledge base. Returns top-3 matches with similarity scores.', techDetail: 'pgvector cosine similarity → top-3 results → similarity threshold check' },
  routing:          { icon: GitBranch,   label: 'Routing Engine',         detail: 'Deterministically routes incidents based on confidence threshold: ≥0.85 → Known (auto-resolve), 0.65–0.84 → Mid (developer), <0.65 → Unknown (AI + SRE).', techDetail: 'Threshold: ≥0.85 Known | 0.65–0.84 Mid | <0.65 Unknown' },
  playbook:         { icon: Zap,         label: 'Playbook Engine',        detail: 'Executes deterministic remediation playbooks for known incident patterns. Runs steps sequentially with rollback support.', techDetail: 'n8n workflow → sequential execution → Jira update' },
  ai_diagnostics:   { icon: Bot,         label: 'AI Diagnostic Engine',   detail: 'Generates root cause hypotheses for novel incidents using LLM analysis of stack traces, logs, and system state. Output is always labeled as a hypothesis.', techDetail: 'GPT-4 → stack trace analysis → root cause hypothesis' },
  verification:     { icon: ShieldCheck, label: 'Verification Engine',    detail: 'Runs 5-point health check: service health, user impact, error rate, connectivity, and SLA status. All checks must pass.', techDetail: '5/5 checks: service, user impact, error rate, connectivity, SLA' },
  resolution:       { icon: CheckCircle, label: 'Incident Resolution',    detail: 'Marks incident as resolved, updates Jira ticket to Done, and triggers the knowledge extraction pipeline.', techDetail: 'Supabase update → Jira Done → knowledge extraction trigger' },
  knowledge_lab:    { icon: BookOpen,    label: 'Knowledge Lab',          detail: 'Extracts the resolution as a structured knowledge entry, generates an embedding, and queues it for curator review before indexing.', techDetail: 'Resolution extraction → embedding → pending_review status → curator queue' },
}

export function StationDrawer() {
  const { openStationDrawer, setOpenStationDrawer, stations } = useOperationsStore()

  const isOpen = openStationDrawer !== null
  const detail = openStationDrawer ? STATION_DETAIL[openStationDrawer] : null
  const station = openStationDrawer ? stations.find(s => s.id === openStationDrawer) : null
  const Icon = detail?.icon

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) setOpenStationDrawer(null) }}>
      <SheetContent
        side="right"
        className="overflow-y-auto"
        style={{
          width: 380,
          background: 'var(--bg-surface)',
          border: 'none',
          borderLeft: '1px solid var(--border-default)',
        }}
        aria-label={detail ? `${detail.label} detail` : 'System station detail'}
      >
        {detail && station && Icon && (
          <>
            <SheetHeader className="pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ width: 40, height: 40, background: 'var(--color-processing-bg)', border: '1px solid var(--color-processing-border)' }}
                >
                  <Icon size={18} color="var(--color-processing)" />
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-processing)' }}>
                    SYSTEM AUTOMATION
                  </div>
                  <SheetTitle className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {detail.label}
                  </SheetTitle>
                </div>
              </div>
            </SheetHeader>

            <div className="pt-4 flex flex-col gap-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  CURRENT STATE
                </div>
                <span className={`station-state-badge ${station.state}`} style={{ fontSize: 10, padding: '3px 8px' }}>
                  {station.state.toUpperCase()}
                </span>
                {station.currentIncidentId && (
                  <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Processing: {station.currentIncidentId}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  DESCRIPTION
                </div>
                <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {detail.detail}
                </div>
              </div>

              <div
                className="rounded-lg p-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  TECHNICAL IMPLEMENTATION
                </div>
                <div className="text-[11px] font-mono" style={{ color: 'var(--color-processing)' }}>
                  {detail.techDetail}
                </div>
              </div>

              {station.lastOperation && (
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    LAST OPERATION
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {station.lastOperation}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
