'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useOperationsStore } from '@/store/operations-store'
import { useFloorSceneStore } from '@/store/floor-scene-store'
import type { HumanRole, StationId } from '@/types'
import {
  Cpu, Brain, Search, GitBranch, Zap, Bot, ShieldCheck,
  CheckCircle, BookOpen, User, Play, Sparkles, Activity,
  Server, ArrowRight, Check, AlertTriangle, RotateCcw, Shield,
  Layers, Terminal, RefreshCw, Eye
} from 'lucide-react'

interface Props {
  onOpenHumanDrawer: (role: HumanRole) => void
  onOpenStationDrawer: (id: StationId) => void
}

export function OperationsFloorScene({ onOpenHumanDrawer, onOpenStationDrawer }: Props) {
  const ops = useOperationsStore()
  const scene = useFloorSceneStore()

  const elena = ops.humans.find(h => h.id === 'commander')!
  const david = ops.humans.find(h => h.id === 'developer')!
  const marcus = ops.humans.find(h => h.id === 'sre')!
  const alisha = ops.humans.find(h => h.id === 'curator')!

  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null)

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden select-none border border-slate-800"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, #0d172a 0%, #060913 75%, #03050a 100%)',
        minHeight: '740px',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8), 0 20px 50px rgba(0,0,0,0.5)',
      }}
      role="region"
      aria-label="FixFlow Virtual Operations Floor Scene"
    >
      {/* ── Floor Background Grid & Ambient Cyber Floor ── */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59,130,246,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59,130,246,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient Floor Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />

      {/* ── Side Server Towers (Left & Right Operations Decor) ── */}
      {/* Left Rack */}
      <div className="absolute top-8 left-4 w-12 rounded-xl p-2 flex flex-col gap-1.5 bg-slate-900/60 border border-slate-800/80 shadow-2xl pointer-events-none hidden md:flex">
        <div className="text-[7px] font-mono text-slate-500 font-bold text-center">RACK-A</div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-slate-950 border border-slate-800 flex items-center justify-between px-1">
            <span className={`w-1 h-1 rounded-full ${i % 3 === 0 ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`} />
            <span className="text-[6px] font-mono text-slate-600">::{i}</span>
          </div>
        ))}
      </div>

      {/* Right Rack */}
      <div className="absolute top-8 right-4 w-12 rounded-xl p-2 flex flex-col gap-1.5 bg-slate-900/60 border border-slate-800/80 shadow-2xl pointer-events-none hidden md:flex">
        <div className="text-[7px] font-mono text-slate-500 font-bold text-center">RACK-B</div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-slate-950 border border-slate-800 flex items-center justify-between px-1">
            <span className={`w-1 h-1 rounded-full ${i % 2 === 0 ? 'bg-purple-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-[6px] font-mono text-slate-600">::{i}</span>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SVG CONDUIT PIPES & LASER PATHWAYS (Physically Connecting Stations)
          ═══════════════════════════════════════════════════════════════════ */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="laser-green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="laser-amber" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="laser-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Central Spine: Intake (top) -> Semantic -> Knowledge -> Routing */}
        <line x1="50%" y1="120" x2="50%" y2="170" stroke="rgba(59,130,246,0.3)" strokeWidth="3" strokeDasharray="4 4" />
        <line x1="50%" y1="230" x2="50%" y2="280" stroke="rgba(168,85,247,0.3)" strokeWidth="3" strokeDasharray="4 4" />
        <line x1="50%" y1="340" x2="50%" y2="390" stroke="rgba(96,165,250,0.3)" strokeWidth="3" strokeDasharray="4 4" />

        {/* Branching from Routing (Y=430) */}
        {/* Branch 1: KNOWN (Left -> Playbook Engine) */}
        <path
          d="M 50% 435 Q 35% 450, 24% 490"
          fill="none"
          stroke={ops.currentRoute === 'known' ? '#22c55e' : 'rgba(255,255,255,0.1)'}
          strokeWidth={ops.currentRoute === 'known' ? 4 : 2}
          strokeDasharray={ops.currentRoute === 'known' ? 'none' : '4 4'}
        />

        {/* Branch 2: MID (Center-Right -> David Chen's Desk) */}
        <path
          d="M 50% 435 Q 60% 320, 75% 180"
          fill="none"
          stroke={ops.currentRoute === 'mid' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}
          strokeWidth={ops.currentRoute === 'mid' ? 4 : 2}
          strokeDasharray={ops.currentRoute === 'mid' ? 'none' : '4 4'}
        />

        {/* Branch 3: UNKNOWN (Right -> AI Diagnostics -> Marcus Lee's Desk) */}
        <path
          d="M 50% 435 Q 70% 450, 78% 490"
          fill="none"
          stroke={ops.currentRoute === 'unknown' ? '#ef4444' : 'rgba(255,255,255,0.1)'}
          strokeWidth={ops.currentRoute === 'unknown' ? 4 : 2}
          strokeDasharray={ops.currentRoute === 'unknown' ? 'none' : '4 4'}
        />

        {/* Bottom Pipeline Conduits: Playbook/Diagnostics -> Verification -> Resolution -> Knowledge Lab */}
        <line x1="24%" y1="560" x2="50%" y2="590" stroke="rgba(34,197,94,0.3)" strokeWidth="2" strokeDasharray="3 3" />
        <line x1="78%" y1="560" x2="50%" y2="590" stroke="rgba(239,68,68,0.3)" strokeWidth="2" strokeDasharray="3 3" />
        <line x1="50%" y1="640" x2="50%" y2="670" stroke="rgba(52,211,153,0.4)" strokeWidth="3" />
      </svg>

      {/* ═══════════════════════════════════════════════════════════════════
          PHYSICALLY ANIMATED INCIDENT TOKEN (Moves through the floor)
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {scene.token.visible && (
          <motion.div
            className="absolute z-40 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 border shadow-2xl"
            style={{
              left: `${scene.token.x}%`,
              top: `${scene.token.y}%`,
              borderColor: ops.currentRoute === 'known' ? '#22c55e' : ops.currentRoute === 'mid' ? '#f59e0b' : '#ef4444',
              boxShadow: `0 0 25px ${ops.currentRoute === 'known' ? 'rgba(34,197,94,0.6)' : ops.currentRoute === 'mid' ? 'rgba(245,158,11,0.6)' : 'rgba(239,68,68,0.6)'}`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="text-[10px] font-mono font-bold text-white tracking-wider">
              {scene.token.label}
            </span>
            <span
              className="text-[8px] font-black px-1.5 py-0.2 rounded"
              style={{
                background: scene.token.priority === 'P1' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)',
                color: scene.token.priority === 'P1' ? '#f87171' : '#fbbf24',
              }}
            >
              {scene.token.priority}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          TOP ROW: COMMAND DESK (ELENA) & DEVELOPER DESK (DAVID)
          ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. Incident Commander: Elena Rodriguez Desk (Top Left) */}
      <div
        onClick={() => onOpenHumanDrawer('commander')}
        className={`absolute top-6 left-16 md:left-24 w-60 rounded-2xl p-3 flex flex-col gap-2 cursor-pointer transition-all duration-300 ${
          elena.state === 'reviewing' || elena.state === 'alerted'
            ? 'bg-purple-950/40 border-purple-500/80 shadow-2xl shadow-purple-500/30'
            : 'bg-slate-900/50 border-slate-800/80 hover:border-purple-500/40'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black tracking-widest text-purple-400">INCIDENT COMMAND DESK</span>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
            elena.state === 'idle' ? 'bg-slate-800 text-slate-400' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          }`}>
            {elena.state === 'idle' ? '● AVAILABLE' : `● ${elena.state.toUpperCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-center p-1 flex-shrink-0">
            <Image src="/assets/humans/Coworking-amico.svg" alt="Elena" width={60} height={60} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">Elena Rodriguez</div>
            <div className="text-[9px] text-slate-400">Incident Commander</div>
            <div className="text-[8px] text-purple-300 font-mono mt-1">SLA: 18m · High Severity</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[9px] text-slate-400">
          <span>Click to open command console</span>
          <ArrowRight size={10} />
        </div>
      </div>

      {/* 2. Developer: David Chen Desk (Top Right) */}
      <div
        onClick={() => onOpenHumanDrawer('developer')}
        className={`absolute top-6 right-16 md:right-24 w-60 rounded-2xl p-3 flex flex-col gap-2 cursor-pointer transition-all duration-300 ${
          david.state === 'investigating' || david.state === 'alerted'
            ? 'bg-amber-950/40 border-amber-500/80 shadow-2xl shadow-amber-500/30 ring-2 ring-amber-500/30'
            : david.state === 'approved' || david.state === 'completed'
            ? 'bg-green-950/30 border-green-500/60'
            : 'bg-slate-900/50 border-slate-800/80 hover:border-amber-500/40'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black tracking-widest text-amber-400">DEVELOPER WORKSTATION</span>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
            david.state === 'idle' ? 'bg-slate-800 text-slate-400' :
            david.state === 'investigating' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' :
            david.state === 'approved' ? 'bg-green-500/20 text-green-300' : 'bg-slate-800 text-slate-400'
          }`}>
            {david.state === 'idle' ? '● AVAILABLE' :
             david.state === 'investigating' ? '🟠 INVESTIGATING' :
             david.state === 'approved' ? '✓ PLAN APPROVED' : `● ${david.state.toUpperCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-center p-1 flex-shrink-0">
            <Image src="/assets/humans/Developer activity-cuate.svg" alt="David" width={60} height={60} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">David Chen</div>
            <div className="text-[9px] text-slate-400">Senior Backend Engineer</div>
            <div className="text-[8px] text-amber-300 font-mono mt-1">Mid Route (0.55–0.84)</div>
          </div>
        </div>

        {/* Direct In-Desk Interactive Action Button when Investigating */}
        {david.state === 'investigating' ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
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
            className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30 transition-all"
          >
            <Check size={11} /> APPROVE PLAN & EXECUTE
          </button>
        ) : (
          <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[9px] text-slate-400">
            <span>Click to inspect code workspace</span>
            <ArrowRight size={10} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CENTRAL AUTOMATION APPARATUS (Intake -> Semantic -> Knowledge -> Routing)
          ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. Intake System Station (Top Center) */}
      <div
        onClick={() => onOpenStationDrawer('intake')}
        className={`absolute top-6 left-1/2 -translate-x-1/2 w-52 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
          ops.stations.find(s => s.id === 'intake')?.state === 'processing'
            ? 'bg-sky-950/40 border-sky-400 shadow-xl shadow-sky-500/20'
            : 'bg-slate-900/60 border-slate-800'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center gap-1.5 mb-1 text-sky-400 text-[8px] font-black tracking-widest uppercase">
          <Cpu size={12} /> INTAKE INGESTION SYSTEM
        </div>
        <div className="text-[11px] font-mono font-bold text-white">POST /fixflow/intake</div>
        <div className="text-[8px] text-slate-400 mt-0.5">Validates Payload Schema v2</div>
      </div>

      {/* 2. Semantic Embedding Engine (Y=180 Center) */}
      <div
        onClick={() => onOpenStationDrawer('semantic')}
        className={`absolute top-44 left-1/2 -translate-x-1/2 w-64 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
          ops.stations.find(s => s.id === 'semantic')?.state === 'processing'
            ? 'bg-purple-950/40 border-purple-400 shadow-xl shadow-purple-500/20'
            : 'bg-slate-900/60 border-slate-800'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center gap-1.5 mb-1 text-purple-400 text-[8px] font-black tracking-widest uppercase">
          <Brain size={12} /> SEMANTIC EMBEDDING ENGINE
        </div>
        <div className="text-[11px] font-mono font-bold text-white">1536-Dimensional Vectors</div>
        <div className="text-[8px] text-slate-400 mt-0.5">OpenAI text-embedding-3-large</div>
      </div>

      {/* 3. pgvector Knowledge Search Station (Y=290 Center) */}
      <div
        onClick={() => onOpenStationDrawer('knowledge_search')}
        className={`absolute top-72 left-1/2 -translate-x-1/2 w-64 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
          ops.stations.find(s => s.id === 'knowledge_search')?.state === 'processing'
            ? 'bg-blue-950/40 border-blue-400 shadow-xl shadow-blue-500/20'
            : 'bg-slate-900/60 border-slate-800'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center gap-1.5 mb-1 text-blue-400 text-[8px] font-black tracking-widest uppercase">
          <Search size={12} /> PGVECTOR KNOWLEDGE SEARCH
        </div>
        <div className="text-[11px] font-mono font-bold text-white">
          {ops.totalSolutionsCount} Solutions Index
        </div>
        <div className="text-[8px] text-slate-400 mt-0.5">Cosine Similarity Scan · 142ms Latency</div>
      </div>

      {/* 4. Confidence Routing Decision Core (Y=400 Center) */}
      <div
        onClick={() => onOpenStationDrawer('routing')}
        className={`absolute top-96 left-1/2 -translate-x-1/2 w-72 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
          ops.currentRoute
            ? 'bg-slate-900 border-amber-400 shadow-2xl shadow-amber-500/20'
            : 'bg-slate-900/60 border-slate-800'
        }`}
        style={{ border: '2px solid' }}
      >
        <div className="flex items-center gap-1.5 mb-1 text-amber-400 text-[9px] font-black tracking-widest uppercase">
          <GitBranch size={13} /> CONFIDENCE ROUTING HUB
        </div>
        <div className="text-sm font-mono font-black text-white">
          {ops.currentSimilarity !== null ? `SIMILARITY: ${ops.currentSimilarity.toFixed(2)}` : 'AWAITING SCORE'}
        </div>
        <div className="text-[8px] text-slate-400 mt-0.5">
          Deterministic Thresholds: Known ≥ 0.85 | Mid 0.55–0.84 | Unknown &lt; 0.55
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MIDDLE-LEFT: PLAYBOOK ENGINE (KNOWN PATH)
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        onClick={() => onOpenStationDrawer('playbook')}
        className={`absolute top-[490px] left-12 md:left-20 w-60 rounded-2xl p-3 flex flex-col gap-1.5 cursor-pointer transition-all duration-300 ${
          ops.stations.find(s => s.id === 'playbook')?.state === 'processing'
            ? 'bg-green-950/40 border-green-400 shadow-2xl shadow-green-500/20 ring-2 ring-green-500/30'
            : 'bg-slate-900/50 border-slate-800'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black tracking-widest text-green-400 flex items-center gap-1">
            <Zap size={10} /> PLAYBOOK ENGINE
          </span>
          <span className="text-[8px] font-mono text-green-300">AUTO</span>
        </div>
        <div className="text-xs font-bold text-white">VPN-AUTH-01 Execution</div>
        <div className="text-[8px] text-slate-400">5/5 Steps Run Sequentially (2.04s MTTR)</div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MIDDLE-RIGHT: SRE MARCUS LEE & AI DIAGNOSTICS (UNKNOWN PATH)
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        onClick={() => onOpenHumanDrawer('sre')}
        className={`absolute top-[490px] right-12 md:right-20 w-64 rounded-2xl p-3 flex flex-col gap-2 cursor-pointer transition-all duration-300 ${
          marcus.state === 'investigating' || marcus.state === 'alerted'
            ? 'bg-red-950/40 border-red-500 shadow-2xl shadow-red-500/30 ring-2 ring-red-500/30'
            : 'bg-slate-900/50 border-slate-800 hover:border-red-500/40'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black tracking-widest text-red-400">TIER-3 SRE RELIABILITY LAB</span>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
            marcus.state === 'idle' ? 'bg-slate-800 text-slate-400' :
            marcus.state === 'investigating' ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse' :
            marcus.state === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-slate-800 text-slate-400'
          }`}>
            {marcus.state === 'idle' ? '● AVAILABLE' :
             marcus.state === 'investigating' ? '🔴 INVESTIGATING' :
             marcus.state === 'completed' ? '✓ FIX APPLIED' : `● ${marcus.state.toUpperCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-center p-1 flex-shrink-0">
            <Image src="/assets/humans/Software engineer-amico.svg" alt="Marcus" width={60} height={60} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">Marcus Lee</div>
            <div className="text-[9px] text-slate-400">Tier-3 Reliability Engineer</div>
            <div className="text-[8px] text-red-300 font-mono mt-0.5">Unknown Route (0.41)</div>
          </div>
        </div>

        {/* Direct In-Desk Interactive Action Button when Investigating */}
        {marcus.state === 'investigating' ? (
          !ops.marcusInvestigation.isComplete ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
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
              className="w-full py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-[10px] font-black flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/30 transition-all"
            >
              <Play size={11} /> START DIAGNOSTIC PROBE
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
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
              className="w-full py-1.5 rounded-lg bg-green-500 hover:bg-green-400 text-black text-[10px] font-black flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/30 transition-all"
            >
              <Check size={11} /> APPLY TIER-3 RESOLUTION
            </button>
          )
        ) : (
          <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[9px] text-slate-400">
            <span>Click to inspect AI diagnostic traces</span>
            <ArrowRight size={10} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM ROW: VERIFICATION ➔ RESOLUTION ➔ KNOWLEDGE CURATOR (ALISHA)
          ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. Verification Engine Shield (Bottom Left-Center) */}
      <div
        onClick={() => onOpenStationDrawer('verification')}
        className={`absolute bottom-6 left-12 md:left-24 w-52 rounded-2xl p-3 flex flex-col gap-1 cursor-pointer transition-all duration-300 ${
          ops.stations.find(s => s.id === 'verification')?.state === 'processing'
            ? 'bg-emerald-950/40 border-emerald-400 shadow-xl shadow-emerald-500/20'
            : 'bg-slate-900/60 border-slate-800'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center gap-1.5 text-emerald-400 text-[8px] font-black tracking-widest uppercase">
          <ShieldCheck size={12} /> VERIFICATION ENGINE
        </div>
        <div className="text-[11px] font-mono font-bold text-white">5/5 Health Checks</div>
        <div className="text-[8px] text-slate-400">Service · Impact · Error Rate · SLA</div>
      </div>

      {/* 2. Incident Resolution (Bottom Center) */}
      <div
        onClick={() => onOpenStationDrawer('resolution')}
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-52 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
          ops.stations.find(s => s.id === 'resolution')?.state === 'done'
            ? 'bg-green-950/40 border-green-400 shadow-2xl shadow-green-500/30'
            : 'bg-slate-900/60 border-slate-800'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center gap-1.5 text-green-400 text-[8px] font-black tracking-widest uppercase">
          <CheckCircle size={12} /> RESOLUTION STATION
        </div>
        <div className="text-[11px] font-mono font-bold text-white">Jira Ticket: DONE</div>
        <div className="text-[8px] text-slate-400">Incident Auto-Closed & Synced</div>
      </div>

      {/* 3. Knowledge Curator: Dr. Alisha Patel Desk (Bottom Right) */}
      <div
        onClick={() => onOpenHumanDrawer('curator')}
        className={`absolute bottom-6 right-12 md:right-24 w-64 rounded-2xl p-3 flex flex-col gap-2 cursor-pointer transition-all duration-300 ${
          alisha.state === 'action_required' || alisha.state === 'reviewing'
            ? 'bg-emerald-950/50 border-emerald-400 shadow-2xl shadow-emerald-500/40 ring-2 ring-emerald-500/30'
            : alisha.state === 'completed'
            ? 'bg-green-950/30 border-green-500/60'
            : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/40'
        }`}
        style={{ border: '1.5px solid' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black tracking-widest text-emerald-400">KNOWLEDGE CURATION HUB</span>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
            alisha.state === 'idle' ? 'bg-slate-800 text-slate-400' :
            alisha.state === 'action_required' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse' :
            alisha.state === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-slate-800 text-slate-400'
          }`}>
            {alisha.state === 'idle' ? '● AVAILABLE' :
             alisha.state === 'action_required' ? '✨ NEW KNOWLEDGE' :
             alisha.state === 'completed' ? '✓ APPROVED' : `● ${alisha.state.toUpperCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center p-1 flex-shrink-0">
            <Image src="/assets/humans/In the office-amico.svg" alt="Alisha" width={60} height={60} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">Dr. Alisha Patel</div>
            <div className="text-[9px] text-slate-400">Knowledge Base Curator</div>
            <div className="text-[8px] text-emerald-300 font-mono mt-0.5">
              {ops.totalSolutionsCount} Solutions Indexed
            </div>
          </div>
        </div>

        {/* Direct In-Desk Interactive Action Button when Curation is Required */}
        {alisha.state === 'action_required' || alisha.state === 'reviewing' ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              ops.setHumanState('curator', 'completed')
              ops.incrementSolutionsCount()
              scene.setLearnedInPgvector(true)
              ops.setStationState('knowledge_lab', 'done')
              ops.addManualActivity({
                stage: 'learned',
                eventType: 'KNOWLEDGE_APPROVED',
                message: `Dr. Alisha Patel approved KB draft — indexed into pgvector (${ops.totalSolutionsCount + 1} solutions)`,
                incidentId: ops.activeIncidentId ?? 'INC-1088',
              })
            }}
            className="w-full py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black text-[10px] font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all"
          >
            <Sparkles size={11} /> APPROVE INTO PGVECTOR (+1 KB)
          </button>
        ) : (
          <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[9px] text-slate-400">
            <span>Click to inspect vector taxonomy</span>
            <ArrowRight size={10} />
          </div>
        )}
      </div>
    </div>
  )
}
