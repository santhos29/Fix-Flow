'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Activity, Wifi, WifiOff } from 'lucide-react'
import { useIncidentSimulationEngine } from '@/store/incident-simulation-engine'

export function Header() {
  const sim = useIncidentSimulationEngine()
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: true }))
      setDateStr(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="h-12 border-b border-slate-800 bg-[#060a12] px-4 flex items-center justify-between select-none text-xs flex-shrink-0 z-50">
      {/* ── Brand Logo ── */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-yellow-300 font-black shadow-md shadow-blue-500/30">
          ⚡
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-black text-white leading-none tracking-tight">FixFlow</span>
          <span className="text-[11px] font-semibold text-slate-400">Operations</span>
        </div>
      </div>

      {/* ── Center Execution Mode & System Health ── */}
      <div className="flex items-center gap-3">
        {/* System Health */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-300 font-mono">OPERATIONAL</span>
        </div>

        {/* Execution Mode Indicator: Clearly Distinguish SIMULATION vs LIVE EXECUTION */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[9px] font-mono text-slate-500 uppercase">MODE:</span>
          {sim.mode === 'LIVE' ? (
            <span className="flex items-center gap-1 font-mono text-[10px] font-black text-emerald-400">
              <Wifi size={11} className="animate-pulse" />
              LIVE EXECUTION
            </span>
          ) : (
            <span className="flex items-center gap-1 font-mono text-[10px] font-black text-sky-400">
              <WifiOff size={11} />
              SIMULATION
            </span>
          )}
        </div>

        {/* Active Incident Badge (if active) */}
        {sim.incidentId && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 font-mono text-[10px]">
            <span className="text-purple-400 font-bold">{sim.incidentId}</span>
            <span className="text-slate-500">•</span>
            <span className="text-purple-300 uppercase">{sim.currentStage}</span>
          </div>
        )}
      </div>

      {/* ── Right Live Clock ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right font-mono hidden sm:block">
          <div className="text-[10px] font-bold text-slate-200 leading-none">{timeStr}</div>
          <div className="text-[8px] text-slate-500 leading-none mt-0.5">{dateStr}</div>
        </div>

        {/* Status notification dot */}
        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <Activity size={13} className="text-emerald-400" />
        </div>
      </div>
    </header>
  )
}
