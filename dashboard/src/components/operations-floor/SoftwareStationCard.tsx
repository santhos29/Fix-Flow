'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { useOperationsStore } from '@/store/operations-store'
import type { StationId } from '@/types'
import { Cpu, Brain, Search, GitBranch, Zap, Bot, ShieldCheck, CheckCircle, BookOpen, ExternalLink, Activity } from 'lucide-react'

const STATION_CONFIG: Record<StationId, {
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
  borderColor: string
  bgColor: string
}> = {
  intake: {
    label: 'Incident Intake',
    sublabel: 'POST /fixflow/intake',
    icon: Cpu,
    color: '#38bdf8',
    borderColor: 'rgba(56,189,248,0.4)',
    bgColor: 'rgba(56,189,248,0.08)',
  },
  semantic: {
    label: 'Semantic Engine',
    sublabel: '1536-dim Vectorizer',
    icon: Brain,
    color: '#a855f7',
    borderColor: 'rgba(168,85,247,0.4)',
    bgColor: 'rgba(168,85,247,0.08)',
  },
  knowledge_search: {
    label: 'Knowledge Search',
    sublabel: 'pgvector Cosine Sim',
    icon: Search,
    color: '#60a5fa',
    borderColor: 'rgba(96,165,250,0.4)',
    bgColor: 'rgba(96,165,250,0.08)',
  },
  routing: {
    label: 'Routing Engine',
    sublabel: 'Threshold Router',
    icon: GitBranch,
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.4)',
    bgColor: 'rgba(245,158,11,0.08)',
  },
  playbook: {
    label: 'Playbook Engine',
    sublabel: 'Remediation Executor',
    icon: Zap,
    color: '#4ade80',
    borderColor: 'rgba(74,222,128,0.4)',
    bgColor: 'rgba(74,222,128,0.08)',
  },
  ai_diagnostics: {
    label: 'AI Diagnostic Engine',
    sublabel: 'GPT-4o Log Analyzer',
    icon: Bot,
    color: '#f87171',
    borderColor: 'rgba(248,113,113,0.4)',
    bgColor: 'rgba(248,113,113,0.08)',
  },
  verification: {
    label: 'Verification Engine',
    sublabel: '5-Point Health Shield',
    icon: ShieldCheck,
    color: '#34d399',
    borderColor: 'rgba(52,211,153,0.4)',
    bgColor: 'rgba(52,211,153,0.08)',
  },
  resolution: {
    label: 'Resolution Station',
    sublabel: 'Jira Auto-Sync',
    icon: CheckCircle,
    color: '#22c55e',
    borderColor: 'rgba(34,197,94,0.4)',
    bgColor: 'rgba(34,197,94,0.08)',
  },
  knowledge_lab: {
    label: 'Knowledge Lab',
    sublabel: 'Vector Index Curator',
    icon: BookOpen,
    color: '#c084fc',
    borderColor: 'rgba(192,132,252,0.4)',
    bgColor: 'rgba(192,132,252,0.08)',
  },
}

interface Props {
  stationId: StationId
  onClick: (id: StationId) => void
  compact?: boolean
}

export function SoftwareStationCard({ stationId, onClick, compact = false }: Props) {
  const ops = useOperationsStore()
  const station = ops.stations.find(s => s.id === stationId)!
  const config = STATION_CONFIG[stationId]
  const Icon = config.icon

  const isProcessing = station.state === 'processing'
  const isDone = station.state === 'done'
  const isError = station.state === 'error'

  return (
    <motion.div
      onClick={() => onClick(stationId)}
      className="relative rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none overflow-hidden"
      style={{
        background: isProcessing
          ? 'linear-gradient(180deg, #131c2e 0%, #0d1522 100%)'
          : isDone
          ? 'linear-gradient(180deg, #0e1e19 0%, #0a1411 100%)'
          : '#0d131f',
        border: `1.5px solid ${
          isProcessing
            ? config.borderColor
            : isDone
            ? 'rgba(34,197,94,0.4)'
            : 'rgba(255,255,255,0.07)'
        }`,
        boxShadow: isProcessing
          ? `0 0 20px ${config.bgColor}, inset 0 0 10px ${config.bgColor}`
          : 'none',
        minWidth: compact ? 120 : 140,
        flex: 1,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* Station Header */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div
            className="p-1 rounded-md"
            style={{
              background: isProcessing ? config.bgColor : 'rgba(255,255,255,0.04)',
              color: isProcessing ? config.color : '#94a3b8',
            }}
          >
            <Icon size={12} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-200 truncate">
            {config.label}
          </span>
        </div>

        {/* State indicator */}
        <span
          className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
          style={{
            background: isProcessing ? `${config.color}22` : isDone ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)',
            color: isProcessing ? config.color : isDone ? '#4ade80' : '#64748b',
          }}
        >
          {isProcessing ? '⟳ ACTIVE' : isDone ? '✓ DONE' : 'IDLE'}
        </span>
      </div>

      {/* Dynamic Visual Content per Station */}
      <div className="my-1">
        {stationId === 'intake' && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[9px] font-mono text-sky-400 truncate">POST /fixflow/intake</div>
            <div className="text-[8px] text-slate-400">Payload Validated · Enqueued</div>
          </div>
        )}

        {stationId === 'semantic' && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[8px] font-mono text-purple-300">
              <span>Embedding Vector</span>
              <span>1536 dim</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-purple-500 h-full rounded-full"
                animate={{ width: isProcessing ? '85%' : isDone ? '100%' : '0%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {stationId === 'knowledge_search' && (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-blue-300">{ops.totalSolutionsCount} solutions</span>
              <span className="text-slate-400">{ops.searchLatencyMs}ms</span>
            </div>
            <div className="text-[8px] text-slate-400 truncate">pgvector Cosine Search</div>
          </div>
        )}

        {stationId === 'routing' && (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-bold text-amber-400 font-mono">
                {ops.currentSimilarity ? `Sim: ${ops.currentSimilarity.toFixed(2)}` : 'Thresholding'}
              </span>
              <span className="text-[8px] font-mono text-slate-400">≥0.85 / 0.55</span>
            </div>
            <div className="text-[8px] text-slate-400 truncate">
              {ops.currentRoute ? `Routed to ${ops.currentRoute.toUpperCase()}` : 'Awaiting score'}
            </div>
          </div>
        )}

        {stationId === 'playbook' && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[8px] font-mono text-green-300">VPN-AUTH-01</div>
            <div className="text-[8px] text-slate-400 truncate">5/5 Steps Auto-Executed</div>
          </div>
        )}

        {stationId === 'ai_diagnostics' && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[8px] font-mono text-red-300">14 Logs Analyzed</div>
            <div className="text-[8px] text-slate-400 truncate">Hypothesis Generator</div>
          </div>
        )}

        {stationId === 'verification' && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[8px] font-mono text-emerald-300">5/5 Health Checks</div>
            <div className="text-[8px] text-slate-400 truncate">Service · SLA · Error Rate</div>
          </div>
        )}

        {stationId === 'resolution' && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[8px] font-mono text-green-300">Jira Sync: Done</div>
            <div className="text-[8px] text-slate-400 truncate">Ticket closed automatically</div>
          </div>
        )}

        {stationId === 'knowledge_lab' && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[8px] font-mono text-purple-300">Vector Index Capture</div>
            <div className="text-[8px] text-slate-400 truncate">Closed-Loop Learning</div>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1 border-t border-white/5 mt-1">
        <span>Click for technical console</span>
        <ExternalLink size={8} />
      </div>
    </motion.div>
  )
}
