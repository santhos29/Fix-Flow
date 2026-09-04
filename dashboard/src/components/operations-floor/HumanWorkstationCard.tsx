'use client'
import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useOperationsStore } from '@/store/operations-store'
import type { HumanRole } from '@/types'
import { CheckCircle, AlertTriangle, ArrowRight, Play, Eye, Sparkles, ShieldAlert, Check } from 'lucide-react'

const ROLE_CONFIG: Record<HumanRole, {
  label: string
  color: string
  borderColor: string
  glowColor: string
  stationName: string
}> = {
  commander: {
    label: 'INCIDENT COMMANDER',
    color: '#c084fc',
    borderColor: 'rgba(168,85,247,0.4)',
    glowColor: 'rgba(168,85,247,0.25)',
    stationName: 'Command & SLA Desk',
  },
  developer: {
    label: 'DEVELOPER (MID-TIER)',
    color: '#fbbf24',
    borderColor: 'rgba(245,158,11,0.4)',
    glowColor: 'rgba(245,158,11,0.25)',
    stationName: 'Backend Workstation',
  },
  sre: {
    label: 'TIER-3 SRE (UNKNOWN)',
    color: '#f87171',
    borderColor: 'rgba(239,68,68,0.4)',
    glowColor: 'rgba(239,68,68,0.25)',
    stationName: 'Reliability Lab',
  },
  curator: {
    label: 'KNOWLEDGE CURATOR',
    color: '#4ade80',
    borderColor: 'rgba(34,197,94,0.4)',
    glowColor: 'rgba(34,197,94,0.25)',
    stationName: 'Vector Governance Hub',
  },
}

interface Props {
  role: HumanRole
  onClick: (role: HumanRole) => void
  onDirectAction?: (role: HumanRole, action: string) => void
}

export function HumanWorkstationCard({ role, onClick }: Props) {
  const ops = useOperationsStore()
  const human = ops.humans.find(h => h.id === role)!
  const config = ROLE_CONFIG[role]

  const isActive = human.state !== 'idle'
  const isAlerted = human.state === 'alerted' || human.state === 'action_required'
  const isInvestigating = human.state === 'investigating' || human.state === 'reviewing'
  const isCompleted = human.state === 'approved' || human.state === 'completed'

  // Dynamic status text
  const statusLabel = {
    idle: '● IDLE',
    alerted: '🔔 ALERTED',
    reviewing: '🔍 REVIEWING',
    investigating: '⚙️ INVESTIGATING',
    action_required: '⚡ ACTION REQUIRED',
    resolving: '🛠️ RESOLVING',
    approved: '✓ APPROVED',
    rejected: '✗ REJECTED',
    escalated: '↗ ESCALATED',
    completed: '✓ COMPLETED',
  }[human.state]

  return (
    <motion.div
      className="relative rounded-xl flex flex-col justify-between overflow-hidden transition-all duration-300"
      style={{
        background: isActive ? 'linear-gradient(180deg, #111827 0%, #0c121e 100%)' : '#0d131f',
        border: `1.5px solid ${isActive ? config.borderColor : 'rgba(255,255,255,0.07)'}`,
        boxShadow: isAlerted
          ? `0 0 24px ${config.glowColor}, inset 0 0 12px ${config.glowColor}`
          : isActive
          ? `0 4px 20px rgba(0,0,0,0.5)`
          : 'none',
        minHeight: 200,
        padding: '12px 14px',
      }}
      animate={isAlerted ? { scale: [1, 1.015, 1] } : {}}
      transition={{ repeat: isAlerted ? Infinity : 0, duration: 2 }}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: isActive ? config.color : '#475569',
              boxShadow: isActive ? `0 0 8px ${config.color}` : 'none',
            }}
          />
          <span
            className="text-[9px] font-black uppercase tracking-wider"
            style={{ color: isActive ? config.color : '#64748b' }}
          >
            {config.label}
          </span>
        </div>

        {/* State Chip */}
        <span
          className="text-[9px] font-extrabold px-2 py-0.5 rounded-full"
          style={{
            background: isActive ? `${config.color}1a` : 'rgba(255,255,255,0.04)',
            color: isActive ? config.color : '#64748b',
            border: `1px solid ${isActive ? `${config.color}44` : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Center Row: Large SVG Illustration & Info */}
      <div className="flex items-center gap-3 my-2">
        {/* Real Storyset SVG Asset Workspace Container */}
        <div
          onClick={() => onClick(role)}
          className="relative rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105 flex-shrink-0"
          style={{
            width: 82,
            height: 82,
            background: isActive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
            border: `1px solid ${isActive ? config.borderColor : 'rgba(255,255,255,0.05)'}`,
            padding: 4,
          }}
        >
          <Image
            src={human.avatar}
            alt={human.name}
            width={78}
            height={78}
            className="object-contain"
            priority={false}
          />
          {isAlerted && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping"
              style={{ background: config.color }}
            />
          )}
        </div>

        {/* Participant Name & Role Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white truncate">{human.name}</div>
          <div className="text-[10px] text-slate-400 truncate">{human.title}</div>
          <div className="text-[9px] font-mono text-slate-500 mt-0.5">{config.stationName}</div>

          {/* Active incident badge if participating */}
          {human.currentIncidentId && isActive && (
            <div
              className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mt-1.5"
              style={{ background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}33` }}
            >
              <span>⚡ {human.currentIncidentId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action / Context Area */}
      <div className="pt-2 border-t border-white/5">
        {/* Dynamic Context Messages or Quick Actions */}
        {role === 'developer' && human.state === 'investigating' && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[9px] text-amber-300 font-medium truncate">
              Suggested: Restart connection pool manager
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  ops.setHumanState('developer', 'approved', ops.activeIncidentId ?? undefined)
                  ops.addManualActivity({
                    stage: 'executing',
                    eventType: 'DEVELOPER_PLAN_APPROVED',
                    message: 'David Chen approved plan — executing DB-CONN-02 playbook',
                    incidentId: ops.activeIncidentId ?? 'INC-1067',
                  })
                  ops.setStationState('playbook', 'processing', ops.activeIncidentId ?? undefined, 'Executing approved remediation')
                  setTimeout(() => {
                    ops.setStationState('verification', 'processing')
                    setTimeout(() => {
                      ops.setStationState('verification', 'done')
                      ops.setStationState('resolution', 'done')
                      ops.setHumanState('curator', 'action_required', ops.activeIncidentId ?? undefined)
                    }, 600)
                  }, 600)
                }}
                className="flex-1 py-1 px-2 rounded text-[10px] font-bold text-black flex items-center justify-center gap-1"
                style={{ background: '#fbbf24' }}
              >
                <Check size={10} /> Approve Plan
              </button>
              <button
                onClick={() => onClick('developer')}
                className="py-1 px-2 rounded text-[10px] font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10"
              >
                <Eye size={10} />
              </button>
            </div>
          </div>
        )}

        {role === 'sre' && human.state === 'investigating' && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[9px] text-red-300 font-medium truncate">
              {ops.marcusInvestigation.isComplete ? 'Root Cause: Connection Pool Exhausted' : 'Novel Deadlock — 14 logs identified'}
            </div>
            <div className="flex items-center gap-1.5">
              {!ops.marcusInvestigation.isComplete ? (
                <button
                  onClick={() => {
                    ops.startMarcusInvestigation()
                    ops.addManualActivity({
                      stage: 'diagnosing',
                      eventType: 'SRE_INVESTIGATION_STARTED',
                      message: 'Marcus Lee running diagnostic checks across 14 stack traces...',
                      incidentId: ops.activeIncidentId ?? 'INC-1088',
                    })
                    setTimeout(() => {
                      ops.completeMarcusInvestigation('Database connection pool exhausted')
                      ops.setHumanState('sre', 'action_required')
                    }, 1200)
                  }}
                  className="flex-1 py-1 px-2 rounded text-[10px] font-bold text-white flex items-center justify-center gap-1"
                  style={{ background: '#ef4444' }}
                >
                  <Play size={10} /> Start Investigation
                </button>
              ) : (
                <button
                  onClick={() => {
                    ops.setHumanState('sre', 'completed')
                    ops.setStationState('verification', 'processing')
                    ops.addManualActivity({
                      stage: 'executing',
                      eventType: 'SRE_RESOLUTION_APPLIED',
                      message: 'Marcus Lee created resolution: Expand pool max_size to 100 with 5s retry',
                      incidentId: ops.activeIncidentId ?? 'INC-1088',
                    })
                    setTimeout(() => {
                      ops.setStationState('verification', 'done')
                      ops.setStationState('resolution', 'done')
                      ops.setHumanState('curator', 'action_required', ops.activeIncidentId ?? undefined)
                    }, 600)
                  }}
                  className="flex-1 py-1 px-2 rounded text-[10px] font-bold text-black flex items-center justify-center gap-1"
                  style={{ background: '#4ade80' }}
                >
                  <Check size={10} /> Apply Fix
                </button>
              )}
              <button
                onClick={() => onClick('sre')}
                className="py-1 px-2 rounded text-[10px] font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10"
              >
                <Eye size={10} />
              </button>
            </div>
          </div>
        )}

        {role === 'curator' && (human.state === 'action_required' || human.state === 'reviewing') && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[9px] text-emerald-300 font-medium truncate">
              Draft KB-1249 ready for vector approval
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  ops.setHumanState('curator', 'completed')
                  ops.incrementSolutionsCount()
                  ops.setStationState('knowledge_lab', 'done')
                  ops.addManualActivity({
                    stage: 'learned',
                    eventType: 'KNOWLEDGE_APPROVED',
                    message: `Dr. Alisha Patel approved KB-1249 — indexed into pgvector (${ops.totalSolutionsCount + 1} solutions)`,
                    incidentId: ops.activeIncidentId ?? 'INC-1088',
                  })
                }}
                className="flex-1 py-1 px-2 rounded text-[10px] font-bold text-black flex items-center justify-center gap-1"
                style={{ background: '#4ade80' }}
              >
                <Sparkles size={10} /> Approve into pgvector
              </button>
              <button
                onClick={() => onClick('curator')}
                className="py-1 px-2 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <Eye size={10} />
              </button>
            </div>
          </div>
        )}

        {/* Default View / Click to open */}
        {!(role === 'developer' && human.state === 'investigating') &&
         !(role === 'sre' && human.state === 'investigating') &&
         !(role === 'curator' && (human.state === 'action_required' || human.state === 'reviewing')) && (
          <button
            onClick={() => onClick(role)}
            className="w-full flex items-center justify-between text-[10px] py-1 px-2 rounded transition-colors text-slate-400 hover:text-white hover:bg-white/5"
          >
            <span>Open Workstation Console</span>
            <ArrowRight size={10} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
