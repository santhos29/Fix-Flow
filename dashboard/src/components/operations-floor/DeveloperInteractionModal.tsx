'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, AlertTriangle, ArrowRight, Code, Terminal,
  ExternalLink, Sparkles, Send, ShieldAlert, Cpu, Check, X,
  Database, RefreshCw, FileText, UserCheck
} from 'lucide-react'
import { useOperationsStore } from '@/store/operations-store'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface Props {
  isOpen: boolean
  onClose: () => void
  onResolveSuccess: () => void
}

export function DeveloperInteractionModal({ isOpen, onClose, onResolveSuccess }: Props) {
  const ops = useOperationsStore()
  const [selectedMatch, setSelectedMatch] = useState<number>(0)
  const [customNotes, setCustomNotes] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const historicalMatches = [
    {
      id: 'KB-089',
      title: 'PostgreSQL connection pool exhaustion during traffic spike',
      similarity: 0.79,
      fix: 'ALTER SYSTEM SET max_connections = 100; SELECT pg_reload_conf(); restart_pool_worker();',
      source: 'INC-942 · 2 weeks ago',
    },
    {
      id: 'KB-031',
      title: 'Checkout service DB connection timeout after redeployment',
      similarity: 0.74,
      fix: 'pool_manager.drain_idle(); pool_manager.set_timeout(30000);',
      source: 'INC-811 · 1 month ago',
    },
    {
      id: 'KB-112',
      title: 'Slow query causing connection backlog on orders DB',
      similarity: 0.69,
      fix: 'CREATE INDEX CONCURRENTLY idx_orders_user_created ON orders (user_id, created_at);',
      source: 'INC-704 · 2 months ago',
    },
  ]

  const handleApplyResolution = async () => {
    setIsExecuting(true)
    ops.setHumanState('developer', 'resolving', ops.activeIncidentId ?? 'INC-1067')
    ops.addManualActivity({
      stage: 'executing',
      eventType: 'DEVELOPER_APPLYING_FIX',
      message: `David Chen applying fix: ${historicalMatches[selectedMatch].title}`,
      incidentId: ops.activeIncidentId ?? 'INC-1067',
    })

    await new Promise(r => setTimeout(r, 700))
    ops.setStationState('playbook', 'processing', ops.activeIncidentId ?? 'INC-1067', 'Executing developer remediation')
    await new Promise(r => setTimeout(r, 600))
    ops.setStationState('playbook', 'done')
    ops.setStationState('verification', 'processing', ops.activeIncidentId ?? 'INC-1067')
    ops.addManualActivity({
      stage: 'verifying',
      eventType: 'VERIFICATION_PASSED',
      message: '5/5 health checks valid: Pool utilization < 45%, DB latency normal',
      incidentId: ops.activeIncidentId ?? 'INC-1067',
    })
    await new Promise(r => setTimeout(r, 500))
    ops.setStationState('verification', 'done')
    ops.setStationState('resolution', 'done')
    ops.setHumanState('developer', 'completed', ops.activeIncidentId ?? 'INC-1067')
    ops.addManualActivity({
      stage: 'resolved',
      eventType: 'JIRA_SYNC_DONE',
      message: 'Jira issue EPL-1067 updated to DONE with developer resolution notes',
      incidentId: ops.activeIncidentId ?? 'INC-1067',
    })

    // Notify Knowledge Curator (Alisha)
    setTimeout(() => {
      ops.setHumanState('curator', 'action_required', ops.activeIncidentId ?? 'INC-1067')
      ops.addManualActivity({
        stage: 'knowledge_capture',
        eventType: 'KNOWLEDGE_REVIEW_REQUIRED',
        message: 'Resolution captured — Dr. Alisha Patel notified for pgvector curation',
        incidentId: ops.activeIncidentId ?? 'INC-1067',
      })
    }, 600)

    setIsExecuting(false)
    setIsDone(true)
    onResolveSuccess()
  }

  const handleEscalateToSRE = () => {
    ops.setHumanState('developer', 'idle')
    ops.setHumanState('sre', 'alerted', ops.activeIncidentId ?? 'INC-1067')
    ops.addManualActivity({
      stage: 'human_review',
      eventType: 'ESCALATED_TO_SRE',
      message: 'David Chen escalated incident to Tier-3 SRE Marcus Lee for deep tracing',
      incidentId: ops.activeIncidentId ?? 'INC-1067',
    })
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        side="right"
        className="overflow-y-auto"
        style={{
          width: 480,
          background: '#0a0f1d',
          border: 'none',
          borderLeft: '1.5px solid rgba(245,158,11,0.3)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
        }}
        aria-label="Developer Interactive Terminal"
      >
        <SheetHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Code size={15} />
              </span>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
                  DEVELOPER WORKSTATION INTERACTION
                </span>
                <SheetTitle className="text-sm font-bold text-white">
                  David Chen — Backend & Middleware
                </SheetTitle>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 font-bold">
              MID (0.72)
            </span>
          </div>
        </SheetHeader>

        <div className="py-3 flex flex-col gap-3.5">
          {/* 1. Incoming Client / Jira Ticket Card */}
          <div className="rounded-xl p-3 bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="text-amber-400 font-bold">JIRA TICKET: EPL-1067 / {ops.activeIncidentId || 'INC-1067'}</span>
              <span>Reporter: Alex Johnson (Client Platform)</span>
            </div>
            <div className="text-xs font-bold text-white">
              Database Connection Timeout on Checkout API
            </div>
            <div className="text-[10px] text-slate-300 leading-relaxed">
              Client reported HTTP 504 Gateway Timeout during flash sale. Prometheus metrics show connection pool at 100% capacity with 42 pending client requests.
            </div>
            <div className="flex items-center gap-2 pt-1 mt-1 border-t border-slate-800/80 text-[9px] text-slate-400">
              <span className="font-bold text-red-400">Priority: P2 High</span>
              <span>•</span>
              <span>Source: Client API Gateway</span>
              <span>•</span>
              <span className="text-amber-400 font-mono">Similarity: 0.72 (Dev Assist)</span>
            </div>
          </div>

          {/* 2. Top-3 Historical Solutions (pgvector matches) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Database size={11} className="text-blue-400" /> PGVECTOR HISTORICAL MATCHES
              </span>
              <span className="text-[9px] font-mono text-blue-400">Cosine Scan: 142ms</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {historicalMatches.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatch(idx)}
                  className={`w-full text-left rounded-xl p-2.5 transition-all text-xs flex flex-col gap-1 ${
                    selectedMatch === idx
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                  style={{ border: '1.5px solid' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold text-amber-400">{m.id}</span>
                    <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      Similarity: {m.similarity}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-white">{m.title}</div>
                  <div className="text-[9px] font-mono text-slate-400">{m.source}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Selected Remediation Script / Code Box */}
          <div className="rounded-xl p-3 bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Terminal size={10} className="text-green-400" /> REMEDIATION CODE TO EXECUTE
              </span>
              <span className="text-green-400 font-bold">Auto-Generated</span>
            </div>
            <pre className="text-[10px] font-mono text-emerald-300 bg-slate-900/90 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed border border-emerald-500/20">
              {historicalMatches[selectedMatch].fix}
            </pre>
          </div>

          {/* 4. Developer Notes */}
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              DEVELOPER RESOLUTION NOTES (SYNCED TO JIRA)
            </span>
            <textarea
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="E.g., Verified pool manager recovery, increased max_connections to 100, latency back to 18ms."
              rows={2}
              className="w-full rounded-xl p-2 text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500/50 resize-none font-sans"
            />
          </div>

          {/* 5. Action Buttons */}
          {isDone ? (
            <div className="rounded-xl p-3 bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
              <span>Resolution executed & Jira updated to DONE. Knowledge Curator notified for curation.</span>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleApplyResolution}
                disabled={isExecuting}
                className="flex-1 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 border-none"
              >
                {isExecuting ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                {isExecuting ? 'Executing Fix...' : 'Apply Fix & Sync to Jira'}
              </Button>
              <Button
                onClick={handleEscalateToSRE}
                variant="outline"
                className="py-2 text-xs font-bold text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                Escalate SRE
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
