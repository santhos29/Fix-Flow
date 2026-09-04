'use client'

import React, { useState } from 'react'
import { useIncidentSimulationEngine } from '@/store/incident-simulation-engine'
import { CheckCircle2, ChevronUp, ChevronDown, GitCommit } from 'lucide-react'

const STAGE_KEYS = [
  'ingestion', 'similarity', 'hypothesis', 'playbook',
  'patch', 'qa', 'resolution', 'kb_writeback',
]

function mapToCanonicalStageIndex(currentStage: string, isResolved: boolean, hasKnowledge: boolean): number {
  if (hasKnowledge) return 7
  if (isResolved || currentStage === 'resolution') return 6
  if (currentStage === 'verification' || currentStage === 'verifying') return 5
  if (currentStage === 'remediation' || currentStage === 'investigating' || currentStage === 'awaiting_human') return 4
  if (currentStage === 'routing') return 3
  if (currentStage === 'knowledge_search') return 2
  if (currentStage === 'normalized' || currentStage === 'embedded') return 1
  if (currentStage === 'received') return 0
  return -1
}

export function IncidentConsole() {
  const sim = useIncidentSimulationEngine()
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveIncident = Boolean(sim.incidentId)
  const isResolved = sim.status === 'resolved' || sim.currentStage === 'resolution'
  const hasKnowledge = Boolean(sim.knowledgeCandidate)

  const currentStageIndex = mapToCanonicalStageIndex(sim.currentStage, isResolved, hasKnowledge)
  const stages = [
    { key: 'ingestion', name: 'INGESTION' },
    { key: 'similarity', name: 'SIMILARITY' },
    { key: 'hypothesis', name: 'HYPOTHESIS' },
    { key: 'playbook', name: 'PLAYBOOK' },
    { key: 'patch', name: 'PATCH' },
    { key: 'qa', name: 'QA' },
    { key: 'resolution', name: 'RESOLUTION' },
    { key: 'kb_writeback', name: 'KB WRITEBACK' },
  ].map((s, idx) => ({
    ...s,
    done: hasActiveIncident && (idx < currentStageIndex || (isResolved && idx <= 6) || (hasKnowledge && idx === 7)),
    active: hasActiveIncident && idx === currentStageIndex && !(isResolved && idx < 6),
  }))

  const routeColor =
    sim.route === 'known' ? 'text-emerald-400' :
    sim.route === 'mid' ? 'text-amber-400' :
    sim.route === 'unknown' ? 'text-rose-400' : 'text-slate-400'

  return (
    <div
      className="border-t border-slate-800 bg-[#060a12] text-xs select-none flex-shrink-0 transition-all"
      role="region"
      aria-label="Incident Console"
    >
      {/* ── Compact Status Bar ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/90 border-b border-slate-800/60 gap-3">
        {/* Incident ID & Title */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${
            hasActiveIncident
              ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-700'
          }`}>
            {sim.incidentId || 'STANDBY'}
          </span>

          {hasActiveIncident && (
            <span className="text-white font-semibold text-xs truncate max-w-[180px] hidden sm:block">
              {sim.title}
            </span>
          )}

          {isResolved && (
            <span className="text-emerald-400 font-mono text-[9px] bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={10} />
              <span>Resolved</span>
            </span>
          )}

          {hasActiveIncident && !isResolved && (
            <span className="text-amber-400 font-mono text-[9px] bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
              {sim.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Pipeline Progress Stepper */}
        <div className="hidden md:flex items-center gap-1 flex-1 max-w-lg px-2">
          {stages.map((st, i) => (
            <React.Fragment key={st.key}>
              <div
                title={st.name}
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[7px] transition-all flex-shrink-0 ${
                  st.done
                    ? 'bg-emerald-500 text-black'
                    : st.active
                    ? 'bg-amber-400 text-black animate-pulse'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {st.done ? '✓' : i + 1}
              </div>
              {i < stages.length - 1 && (
                <div className={`flex-1 h-[1px] rounded-full transition-all ${
                  stages[i + 1].done ? 'bg-emerald-500' : 'bg-slate-800'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Right metrics & expand toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Compact key metrics */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[9px]">
            {sim.similarity !== null && (
              <span className="flex items-center gap-1">
                <span className="text-slate-500">SIM</span>
                <span className={`font-bold ${routeColor}`}>{sim.similarity.toFixed(2)}</span>
              </span>
            )}
            {sim.route && (
              <span className="flex items-center gap-1">
                <GitCommit size={9} className={routeColor} />
                <span className={`font-bold uppercase ${routeColor}`}>{sim.route}</span>
              </span>
            )}
            {sim.verificationStatus === 'passed' && (
              <span className="text-emerald-400 font-bold text-[9px]">5/5 ✓</span>
            )}
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-sky-400 bg-sky-950/40 border border-sky-700/30">
              {sim.mode}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded-md transition-all cursor-pointer"
          >
            <span>{isExpanded ? 'Less' : 'Details'}</span>
            {isExpanded ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          </button>
        </div>
      </div>

      {/* ── Expandable Evidence Panel ── */}
      {isExpanded && (
        <div className="px-3 py-2 text-[10px] font-mono bg-slate-950/60 border-b border-slate-800/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">Route</div>
              <div className={`font-bold uppercase ${routeColor}`}>{sim.route || 'IDLE'}</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">Stage</div>
              <div className="text-white font-bold uppercase">{sim.currentStage}</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">Confidence</div>
              <div className={`font-bold ${routeColor}`}>
                {sim.similarity !== null ? sim.similarity.toFixed(2) : '--'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">Status</div>
              <div className="text-emerald-400 font-bold uppercase">{sim.status}</div>
            </div>
            {sim.assignedHuman && (
              <div className="col-span-2">
                <div className="text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">Assigned</div>
                <div className="text-slate-200 capitalize">{sim.assignedHuman}</div>
              </div>
            )}
            {sim.playbookId && (
              <div className="col-span-2">
                <div className="text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">Playbook</div>
                <div className="text-purple-300">{sim.playbookId}</div>
              </div>
            )}
          </div>
          {sim.timeline.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-0.5 max-h-16 overflow-y-auto">
              {sim.timeline.slice(-4).map(e => (
                <div key={e.id} className="flex items-center gap-2 text-[9px]">
                  <span className="text-slate-600 flex-shrink-0">{e.timestamp}</span>
                  <span className="text-slate-400 truncate">{e.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
