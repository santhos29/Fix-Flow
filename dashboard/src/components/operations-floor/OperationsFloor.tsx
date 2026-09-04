'use client'

import React, { useState } from 'react'
import { PixiFloorCanvas } from './PixiFloorCanvas'
import { LiveActivityPanel } from '../activity/LiveActivityPanel'
import { IncidentConsole } from './IncidentConsole'
import { HumanDrawer } from './HumanDrawer'
import { StationDrawer } from './StationDrawer'
import type { HumanRole, StationId } from '@/types'

export function OperationsFloor() {
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'human' | 'station'; id: string } | null>(null)

  const handleSelectHuman = (role: HumanRole) => {
    setSelectedEntity({ type: 'human', id: role })
  }

  const handleSelectStation = (id: StationId) => {
    setSelectedEntity({ type: 'station', id })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#060a12' }}>
      {/* ── Subheader Bar: Clean, uncluttered ── */}
      <div
        className="flex items-center justify-between px-3 py-1 flex-shrink-0"
        style={{ background: '#090e18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            FixFlow Operations
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Live Engineering Floor</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
          <span>Autonomous Incident Operations</span>
        </div>
      </div>

      {/* ── Main Floor + Right Feed ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* PixiJS Operations Floor (Hero Experience) */}
        <div className="flex-1 flex flex-col p-2 min-h-0 overflow-hidden">
          <PixiFloorCanvas
            onOpenHumanDrawer={handleSelectHuman}
            onOpenStationDrawer={handleSelectStation}
          />
        </div>

        {/* Right Activity & Evidence Panel */}
        <div
          className="flex-shrink-0 hidden lg:flex flex-col"
          style={{
            width: 290,
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            background: '#080d16',
          }}
        >
          <LiveActivityPanel
            selectedEntity={selectedEntity}
            onClearSelection={() => setSelectedEntity(null)}
          />
        </div>
      </div>

      {/* ── Bottom Console (Compact & Collapsible) ── */}
      <IncidentConsole />

      {/* ── Interactive Drawers ── */}
      <HumanDrawer />
      <StationDrawer />
    </div>
  )
}
