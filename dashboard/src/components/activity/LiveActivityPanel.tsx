'use client'

import React, { useState } from 'react'
import { useIncidentSimulationEngine } from '@/store/incident-simulation-engine'
import { EvidenceProvenancePanel } from '../operations-floor/EvidenceProvenancePanel'
import { Radio, Activity, FileText } from 'lucide-react'

interface Props {
  selectedEntity?: { type: 'human' | 'station'; id: string } | null
  onClearSelection?: () => void
}

const STAGE_DOT_COLOR: Record<string, string> = {
  received: '#38bdf8',
  normalized: '#a855f7',
  embedded: '#a855f7',
  knowledge_search: '#f59e0b',
  routing: '#22c55e',
  remediation: '#22c55e',
  verification: '#34d399',
  resolution: '#4ade80',
  knowledge_capture: '#c084fc',
}

export function LiveActivityPanel({ selectedEntity, onClearSelection }: Props) {
  const sim = useIncidentSimulationEngine()
  const [activeTab, setActiveTab] = useState<'events' | 'evidence'>('events')
  const events = sim.timeline
  const hasEvents = events.length > 0

  // Automatically show evidence tab if an entity is clicked
  const effectiveTab = selectedEntity ? 'evidence' : activeTab

  return (
    <div className="flex flex-col h-full overflow-hidden select-none text-xs bg-[#080d16]">
      {/* ── Tab Switcher Header ── */}
      <div className="p-2 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0 bg-slate-950/60">
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              effectiveTab === 'events'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={11} />
            <span>Events</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              effectiveTab === 'evidence'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={11} />
            <span>Evidence</span>
          </button>
        </div>

        <span className="font-mono text-[9px] text-slate-500 bg-slate-900/80 border border-slate-800/80 px-2 py-0.5 rounded">
          {hasEvents ? `${events.length} Events` : 'Standby'}
        </span>
      </div>

      {/* ── Content Area: Events or Evidence ── */}
      <div className="flex-1 overflow-y-auto">
        {effectiveTab === 'evidence' ? (
          <EvidenceProvenancePanel
            selectedEntity={selectedEntity}
            onClearSelection={onClearSelection}
          />
        ) : hasEvents ? (
          <div className="p-2.5 space-y-2">
            {events.slice(-12).map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-[11px] animate-fade-in border-b border-slate-900/60 pb-1.5 last:border-0">
                <span className="font-mono text-[9px] text-slate-500 pt-0.5 flex-shrink-0">
                  {e.timestamp}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: STAGE_DOT_COLOR[e.stage] || '#38bdf8' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-200 leading-snug break-words">
                    {e.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4 py-8 text-slate-500">
            <Radio size={20} className="mb-2 text-slate-600 animate-pulse" />
            <div className="font-bold text-slate-300 text-xs font-mono">STANDBY</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Ready
            </div>
          </div>
        )}
      </div>

      {/* ── Compact System Status Card ── */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/70 flex flex-col gap-1.5 flex-shrink-0 font-mono text-[9px]">
        <div className="grid grid-cols-2 gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
          <div>
            <span className="text-slate-500 block">MODE</span>
            <span className="text-sky-400 font-bold">{sim.mode}</span>
          </div>
          <div>
            <span className="text-slate-500 block">INCIDENT</span>
            <span className="text-purple-300 font-bold truncate block">{sim.incidentId || 'NONE'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">STAGE</span>
            <span className="text-slate-300 font-bold uppercase truncate block">{sim.currentStage}</span>
          </div>
          <div>
            <span className="text-slate-500 block">CONFIDENCE</span>
            <span className={sim.route === 'known' ? 'text-emerald-400 font-bold' : sim.route === 'mid' ? 'text-amber-400 font-bold' : sim.route === 'unknown' ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {sim.similarity !== null ? sim.similarity.toFixed(2) : '--'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-500 text-[8px] pt-0.5">
          <span>FixFlow Engine</span>
          <span className="text-emerald-400 font-bold uppercase">{sim.status}</span>
        </div>
      </div>
    </div>
  )
}
