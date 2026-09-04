'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { FloorScene } from '@/pixi/FloorScene'
import { useIncidentSimulationEngine } from '@/store/incident-simulation-engine'
import { DeveloperInteractionModal } from './DeveloperInteractionModal'
import { ClientJiraIngestionModal } from './ClientJiraIngestionModal'
import { FixFlowTerminal } from '../terminal/FixFlowTerminal'
import type { HumanRole, StationId } from '@/types'
import {
  Inbox, Play, RotateCcw, RefreshCw, CheckCircle2,
  Wifi, WifiOff, Maximize2, Terminal, ShieldAlert
} from 'lucide-react'

interface Props {
  onOpenHumanDrawer: (role: HumanRole) => void
  onOpenStationDrawer: (id: StationId) => void
}

export function PixiFloorCanvas({ onOpenHumanDrawer, onOpenStationDrawer }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const floorSceneRef = useRef<FloorScene | null>(null)
  const sim = useIncidentSimulationEngine()

  const [isDevModalOpen,    setIsDevModalOpen]    = useState(false)
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false)
  const [isTerminalOpen,    setIsTerminalOpen]    = useState(false)

  // ── PIXI SCENE INITIALIZATION & OBSERVER REGISTRATION ──────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let isCancelled = false

    const handleSelectEntity = (type: 'human' | 'station', id: string) => {
      if (type === 'human') onOpenHumanDrawer(id as HumanRole)
      else onOpenStationDrawer(id as StationId)
    }

    const floorScene = new FloorScene(containerRef.current, handleSelectEntity)
    floorSceneRef.current = floorScene
    floorScene.init().catch(err => {
      if (!isCancelled) console.error('Pixi init error:', err)
    })

    // Register Floor Scene as observer to the centralized Simulation Engine
    const unregisterObserver = sim.registerFloorObserver({
      onStationTransition: (station, incidentId) => {
        floorSceneRef.current?.animateIncidentTo(station, incidentId)
      },
      onRouteSelected: (route) => {
        floorSceneRef.current?.setTokenRoute(route)
      },
      onHumanStateChange: (human, state) => {
        floorSceneRef.current?.setCharacterState(human, state)
      },
      onHumanWalk: async (human, station, taskBubble) => {
        await floorSceneRef.current?.walkCharacterToStation(human, station, taskBubble)
      },
      onWalkCharacterToCharacter: async (src, dst, taskBubble) => {
        await floorSceneRef.current?.walkCharacterToCharacter(src, dst, taskBubble)
      },
      onHumanBubble: (human, text, type) => {
        floorSceneRef.current?.showCharacterBubble(human, text, 3800, type as import('@/pixi/SpeechBubbleOverlay').BubbleType | undefined)
      },
      onHumanReturnHome: async (human) => {
        await floorSceneRef.current?.returnCharacterHome(human)
      },
      onKnowledgeBubble: () => {
        floorSceneRef.current?.captureKnowledge()
      },
      onClientArrive: async (name, role) => {
        await floorSceneRef.current?.clientArrive(name, role)
      },
      onClientExit: async () => {
        await floorSceneRef.current?.clientExit()
      },
      onClientMail: async () => {
        await floorSceneRef.current?.sendClientMail()
      },
      onMailNotification: (title, incidentId, severity) => {
        floorSceneRef.current?.showMailNotification(title, incidentId, severity)
      },
      onDevOpsHighActivity: (active) => {
        floorSceneRef.current?.setDevOpsHighActivity(active)
      },
      onResetScene: () => {
        const sc = floorSceneRef.current
        if (sc) {
          sc.clearToken()
          sc.resetKbCounter()
          sc.setDevOpsHighActivity(false)
          sc.hideClientImmediate()
          const humanIds = ['elena', 'david', 'priya', 'arjun', 'sofia', 'daniel', 'maya', 'noah', 'ananya', 'marcus']
          humanIds.forEach(h => sc.setCharacterState(h, 'idle'))
          sc.autoFitToContainer()
        }
      },
    })

    return () => {
      isCancelled = true
      unregisterObserver()
      if (floorSceneRef.current) {
        floorSceneRef.current.destroy()
        floorSceneRef.current = null
      }
    }
  }, [onOpenHumanDrawer, onOpenStationDrawer, sim])

  // ── SCENARIO ACTIONS ──────────────────────────────────────────────────────
  const handleRunKnown = useCallback(() => {
    setIsDevModalOpen(false)
    sim.runKnownScenario()
  }, [sim])

  const handleRunMid = useCallback(() => {
    setIsDevModalOpen(false)
    sim.runMidScenario(() => {
      setIsDevModalOpen(true)
    })
  }, [sim])

  const handleRunUnknown = useCallback(() => {
    setIsDevModalOpen(false)
    sim.runUnknownScenario(() => {
      sim.approveElenaSignoff()
    })
  }, [sim])

  const handleRunFailure = useCallback(() => {
    setIsDevModalOpen(false)
    sim.runFailureScenario()
  }, [sim])

  const handleRunRandom = useCallback(() => {
    setIsDevModalOpen(false)
    sim.runRandomCorrectiveScenario(
      () => setIsDevModalOpen(true),
      () => sim.approveElenaSignoff()
    )
  }, [sim])

  const handleReplay = useCallback(() => {
    setIsDevModalOpen(false)
    sim.runReplayScenario()
  }, [sim])

  const handleReset = useCallback(() => {
    setIsDevModalOpen(false)
    setIsIngestModalOpen(false)
    sim.reset()
  }, [sim])

  return (
    <div className="relative w-full flex flex-col gap-2 select-none h-full min-h-0">
      {/* Human Decision Modal */}
      <DeveloperInteractionModal
        isOpen={isDevModalOpen}
        onClose={() => {
          setIsDevModalOpen(false)
          floorSceneRef.current?.returnCharacterHome('david')
        }}
        onResolveSuccess={() => {
          setIsDevModalOpen(false)
          sim.approveHumanFix()
        }}
      />

      {/* Jira / Ingestion Modal */}
      <ClientJiraIngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngest={(ticket) => {
          const override = {
            id: ticket.id,
            title: ticket.title,
            route: ticket.route,
            similarity: ticket.similarity,
            priority: ticket.priority,
            description: ticket.description,
            service: ticket.service || 'Production Microservice',
            category: (ticket.category || 'Backend') as any,
            clientName: ticket.clientName,
            clientRole: ticket.clientRole,
            logSnippet: ticket.logSnippet,
            rootCause: ticket.rootCause,
            resolution: ticket.resolution,
            latencyBefore: ticket.latencyBefore,
            latencyAfter: ticket.latencyAfter,
            errorRateBefore: ticket.errorRateBefore,
            errorRateAfter: ticket.errorRateAfter,
            saturationBefore: ticket.saturationBefore,
            saturationAfter: ticket.saturationAfter,
          }
          if (ticket.route === 'known') sim.runKnownScenario(override)
          else if (ticket.route === 'mid') {
            setIsDevModalOpen(false)
            sim.runMidScenario(() => setIsDevModalOpen(true), override)
          } else if (ticket.similarity < 0.35) {
            sim.runFailureScenario(override)
          } else {
            setIsDevModalOpen(false)
            sim.runUnknownScenario(() => sim.approveElenaSignoff(), override)
          }
        }}
      />

      {/* FixFlow Terminal (floating overlay) */}
      <FixFlowTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onViewOnFloor={(t) => {
          const assignStr = String(t.assignedHuman || '').toLowerCase()
          if (assignStr.includes('david')) onOpenHumanDrawer('developer')
          else if (assignStr.includes('marcus')) onOpenHumanDrawer('sre')
          else if (assignStr.includes('arjun') || assignStr.includes('sofia')) onOpenHumanDrawer('developer')
          else onOpenHumanDrawer('commander')
        }}
      />

      {/* ── Compact Horizontal Control Strip ── */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/95 border border-slate-800 flex-shrink-0 overflow-x-auto whitespace-nowrap">
        {/* Left: Ingest / Mode */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-black bg-sky-400 hover:bg-sky-300 shadow-sm transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <Inbox size={11} />
            <span>Ingest</span>
          </button>

          <button
            onClick={() => sim.setMode(sim.mode === 'LIVE' ? 'SIMULATION' : 'LIVE')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              sim.mode === 'LIVE'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {sim.mode === 'LIVE' ? <Wifi size={11} className="animate-pulse" /> : <WifiOff size={11} />}
            <span>{sim.mode === 'LIVE' ? 'Live' : 'Simulate'}</span>
          </button>
        </div>

        {/* Center: Scenarios */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleRunRandom}
            disabled={sim.isPlaying}
            title="Dispatch a random corrective maintenance issue from a new client"
            className="scenario-btn text-[10px] py-1 px-2 whitespace-nowrap flex items-center gap-1 bg-purple-950/50 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60"
          >
            <span>🎲 Random Issue</span>
          </button>

          <button
            onClick={handleRunKnown}
            disabled={sim.isPlaying}
            className="scenario-btn known text-[10px] py-1 px-2 whitespace-nowrap"
          >
            <Play size={9} /> 1 · Known
          </button>

          <button
            onClick={handleRunMid}
            disabled={sim.isPlaying}
            className="scenario-btn mid text-[10px] py-1 px-2 whitespace-nowrap"
          >
            <Play size={9} /> 2 · Mid
          </button>

          <button
            onClick={handleRunUnknown}
            disabled={sim.isPlaying}
            className="scenario-btn unknown text-[10px] py-1 px-2 whitespace-nowrap"
          >
            <Play size={9} /> 3 · Unknown
          </button>

          <button
            onClick={handleRunFailure}
            disabled={sim.isPlaying}
            title="Graceful Failure — Insufficient Evidence"
            className="scenario-btn text-[10px] py-1 px-2 whitespace-nowrap flex items-center gap-1"
            style={{
              background: 'rgba(239,68,68,0.12)',
              borderColor: 'rgba(239,68,68,0.4)',
              color: '#f87171',
            }}
          >
            <ShieldAlert size={9} /> 4 · Fail
          </button>

          <button
            onClick={handleReplay}
            disabled={sim.isPlaying}
            className="scenario-btn text-[10px] py-1 px-2 whitespace-nowrap flex items-center gap-1"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(168,85,247,0.15))',
              borderColor: 'rgba(34,197,94,0.4)',
              color: '#4ade80',
            }}
          >
            <RefreshCw size={9} className={sim.isPlaying ? 'animate-spin' : ''} />
            ↻ Replay
          </button>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => floorSceneRef.current?.autoFitToContainer()}
            title="Fit floor to canvas"
            className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Maximize2 size={10} />
            <span>Fit</span>
          </button>

          <button
            onClick={handleReset}
            title="Reset scene"
            className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={10} />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setIsTerminalOpen(v => !v)}
            title="FixFlow Terminal"
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              isTerminalOpen
                ? 'bg-purple-600/30 border border-purple-500/40 text-purple-300'
                : 'text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Terminal size={10} />
            <span>Terminal</span>
          </button>
        </div>
      </div>

      {/* Replay Banner */}
      {sim.replayBanner && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-300 font-medium flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <span className="truncate">{sim.replayBanner}</span>
          </div>
          <span className="font-mono text-[9px] text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded-full border border-emerald-500/30 flex-shrink-0">
            LEARNED · 0.41 ➔ 0.94
          </span>
        </div>
      )}

      {/* PixiJS 2D Engine Canvas */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-[460px] rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl"
        style={{ background: '#070b14' }}
      />
    </div>
  )
}
