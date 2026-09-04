'use client'

import React, { useState } from 'react'
import {
  Inbox, Send, AlertTriangle, FileText, CheckCircle,
  Sparkles, Database, ShieldAlert, X, ArrowRight, Dices,
  Server, Cpu, Activity, User, ChevronRight, Terminal
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  CORRECTIVE_MAINTENANCE_POOL,
  CLIENT_PERSONAS,
  CorrectiveIncidentDefinition
} from '@/store/incident-simulation-engine'

export interface IngestedTicket {
  id: string
  title: string
  source: 'Jira' | 'Client Webhook' | 'Prometheus' | 'Datadog'
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  description: string
  similarity: number
  route: 'known' | 'mid' | 'unknown'
  service?: string
  category?: string
  clientName?: string
  clientRole?: string
  logSnippet?: string
  rootCause?: string
  resolution?: string
  latencyBefore?: number
  latencyAfter?: number
  errorRateBefore?: number
  errorRateAfter?: number
  saturationBefore?: number
  saturationAfter?: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onIngest: (ticket: IngestedTicket) => void
}

export function ClientJiraIngestionModal({ isOpen, onClose, onIngest }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const [selectedPersonaIdx, setSelectedPersonaIdx] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const categories = ['ALL', 'Database', 'Backend', 'Cache', 'Streaming', 'Infrastructure', 'Security']

  const filteredPool = selectedCategory === 'ALL'
    ? CORRECTIVE_MAINTENANCE_POOL
    : CORRECTIVE_MAINTENANCE_POOL.filter(p => p.category === selectedCategory)

  const activeDef = filteredPool[selectedIdx] || filteredPool[0] || CORRECTIVE_MAINTENANCE_POOL[0]
  const activePersona = CLIENT_PERSONAS[selectedPersonaIdx % CLIENT_PERSONAS.length]

  const handleTriggerIngest = (def: CorrectiveIncidentDefinition, persona = activePersona) => {
    const ticket: IngestedTicket = {
      id: def.id,
      title: def.title,
      source: def.route === 'unknown' ? 'Client Webhook' : 'Jira',
      priority: def.priority,
      description: def.description,
      similarity: def.similarity,
      route: def.route,
      service: def.service,
      category: def.category,
      clientName: persona.name,
      clientRole: persona.role,
      logSnippet: def.logSnippet,
      rootCause: def.rootCause,
      resolution: def.resolution,
      latencyBefore: def.latencyBefore,
      latencyAfter: def.latencyAfter,
      errorRateBefore: def.errorRateBefore,
      errorRateAfter: def.errorRateAfter,
      saturationBefore: def.saturationBefore,
      saturationAfter: def.saturationAfter,
    }
    onIngest(ticket)
    onClose()
  }

  const handleRandomDispatch = () => {
    const randDef = CORRECTIVE_MAINTENANCE_POOL[Math.floor(Math.random() * CORRECTIVE_MAINTENANCE_POOL.length)]
    const randPersona = CLIENT_PERSONAS[Math.floor(Math.random() * CLIENT_PERSONAS.length)]
    handleTriggerIngest(randDef, randPersona)
  }

  const rotatePersona = () => {
    setSelectedPersonaIdx((prev) => (prev + 1) % CLIENT_PERSONAS.length)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        side="right"
        className="overflow-y-auto"
        style={{
          width: 520,
          background: '#070b14',
          border: 'none',
          borderLeft: '1.5px solid rgba(56,189,248,0.35)',
          boxShadow: '-12px 0 45px rgba(0,0,0,0.85)',
        }}
        aria-label="Corrective Maintenance Incident Intake"
      >
        <SheetHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Inbox size={16} />
            </span>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                CORRECTIVE MAINTENANCE GATEWAY
              </span>
              <SheetTitle className="text-sm font-bold text-white">
                Client Ticket & Anomaly Ingestion
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="py-3 flex flex-col gap-3.5">
          {/* 🎲 RANDOM DISPATCH PROMINENT ACTION */}
          <button
            onClick={handleRandomDispatch}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-purple-600/20 transition-all cursor-pointer border border-purple-400/30"
          >
            <div className="flex items-center gap-2">
              <Dices size={16} className="text-amber-300 animate-spin-slow" />
              <div className="text-left">
                <div className="text-[11px] font-bold">🎲 Dispatch Random Client & Issue</div>
                <div className="text-[8.5px] text-purple-200 font-normal">
                  Picks a random customer persona and realistic corrective maintenance problem
                </div>
              </div>
            </div>
            <ArrowRight size={13} className="text-white/80" />
          </button>

          {/* CLIENT PERSONA SELECTOR */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs flex-shrink-0">
                <User size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  Active Client Reporter
                </div>
                <div className="text-[11px] font-bold text-white truncate">{activePersona.name}</div>
                <div className="text-[8.5px] text-sky-400 truncate">{activePersona.role}</div>
              </div>
            </div>
            <button
              onClick={rotatePersona}
              className="text-[9px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 cursor-pointer flex-shrink-0"
            >
              Rotate Client ↻
            </button>
          </div>

          {/* CATEGORY FILTER PILLS */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              CORRECTIVE ISSUE CATALOG ({CORRECTIVE_MAINTENANCE_POOL.length} Real Scenarios)
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setSelectedIdx(0); }}
                  className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* INCIDENT SELECTION LIST */}
          <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-0.5">
            {filteredPool.map((t, idx) => {
              const isSelected = selectedIdx === idx
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedIdx(idx)}
                  className={`rounded-xl p-2.5 cursor-pointer transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-400/80 shadow-md shadow-sky-500/10'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                  style={{ border: '1.2px solid' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold text-sky-400 flex items-center gap-1.5">
                      <span>{t.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[8px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {t.category}
                      </span>
                    </span>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                      t.route === 'known' ? 'bg-green-500/20 text-green-300' :
                      t.route === 'mid' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {t.route === 'known' ? `KNOWN (${t.similarity.toFixed(2)})` :
                       t.route === 'mid' ? `MID (${t.similarity.toFixed(2)})` : `UNKNOWN (${t.similarity.toFixed(2)})`}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white mt-0.5">{t.title}</div>
                  <div className="text-[9.5px] text-slate-400 line-clamp-2 leading-relaxed font-sans">{t.description}</div>

                  {isSelected && (
                    <div className="mt-1 pt-1.5 border-t border-slate-800/80 space-y-1 font-mono text-[8.5px]">
                      <div className="text-slate-400 truncate">
                        <span className="text-slate-500">Service: </span>
                        <span className="text-slate-200">{t.service}</span>
                      </div>
                      <div className="p-1 rounded bg-black/60 text-amber-300/80 text-[8px] truncate">
                        <span className="text-rose-400">[LOG] </span>{t.logSnippet}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* INGEST BUTTON */}
          <Button
            onClick={() => handleTriggerIngest(activeDef)}
            className="w-full py-2.5 text-xs font-bold text-black bg-sky-400 hover:bg-sky-300 flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 border-none cursor-pointer mt-1"
          >
            <Send size={13} />
            Ingest {activeDef.id} ({activePersona.name.split(' ')[0]}) into Floor
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
