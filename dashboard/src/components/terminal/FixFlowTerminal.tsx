'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Terminal, X, Minus, Square, ExternalLink,
  CheckCircle2, AlertTriangle, ShieldAlert, GitCommit, FileText, ArrowRight
} from 'lucide-react'
import { useIncidentSimulationEngine } from '@/store/incident-simulation-engine'

interface Props {
  isOpen: boolean
  onClose: () => void
  onViewOnFloor?: (ticket: {
    id: string
    title: string
    route?: 'known' | 'mid' | 'unknown'
    similarity?: number
    assignedHuman?: string
    status?: string
  }) => void
}

interface CommandHistoryItem {
  id: string
  command?: string
  output: string | React.ReactNode
  type?: 'input' | 'output' | 'error' | 'success'
}

interface DiagnosticTimelineEntry {
  timestamp: string
  source: string
  message: string
}

interface JiraTicketData {
  id: string
  key: string
  summary: string
  description?: string
  status: string
  priority: string
  route?: 'KNOWN' | 'MID' | 'UNKNOWN'
  similarity?: number
  assignee: string
  reporter: string
  created: string
  updated: string
  resolution?: string | null
  labels: string[]
  issueType: string
  hasDiagnostics: boolean
  diagnosticSteps?: string[] | null
  diagnosticTimeline?: DiagnosticTimelineEntry[]
  rootCause?: string | null
  resolutionDetails?: string | null
  verification?: string | null
  knowledge?: string | null
  comments?: Array<{
    id: string
    author: string
    created: string
    body: string
  }>
  raw?: Record<string, unknown>
}

interface JiraApiResponse {
  found: boolean
  errorType?: 'NOT_FOUND' | 'CONNECTION_ERROR' | 'INVALID_INPUT'
  ticketId?: string
  message?: string
  source?: 'Jira API' | 'FixFlow Incident Store (JIRA Mirror)'
  ticket?: JiraTicketData
}

export function FixFlowTerminal({ isOpen, onClose, onViewOnFloor }: Props) {
  const sim = useIncidentSimulationEngine()
  const [inputVal, setInputVal] = useState('')
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      output: (
        <div className="text-slate-400 space-y-0.5">
          <div className="text-purple-400 font-bold">FixFlow Interactive Operations Console v2.1.0</div>
          <div className="text-slate-500">Connected to internal operations floor simulation & event bridge.</div>
          <div className="text-slate-500">JIRA Read-Only Diagnostic Retrieval enabled.</div>
          <div className="text-emerald-400">Type &apos;help&apos; for available commands.</div>
        </div>
      ),
    },
  ])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState<number>(-1)
  const [isMaximized, setIsMaximized] = useState(false)
  const [focusedTicketId, setFocusedTicketId] = useState<string | null>(null)

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  if (!isOpen) return null

  const handleViewOnFloor = (ticket: JiraTicketData) => {
    const route = (ticket.route?.toLowerCase() as 'known' | 'mid' | 'unknown') || 'known'
    sim.loadTicketForInspection({
      id: ticket.key,
      title: ticket.summary,
      route,
      similarity: ticket.similarity,
      assignedHuman: ticket.assignee,
      status: ticket.status,
      priority: ticket.priority,
    })

    setFocusedTicketId(ticket.key)
    onViewOnFloor?.({
      id: ticket.key,
      title: ticket.summary,
      route,
      similarity: ticket.similarity,
      assignedHuman: ticket.assignee,
      status: ticket.status,
    })

    setTimeout(() => {
      setFocusedTicketId(null)
    }, 3500)
  }

  // ── Render structured JIRA Ticket Response ───────────────────────────────
  const renderJiraResponse = (
    data: JiraApiResponse,
    requestedTicketId: string,
    mode: 'full' | 'summary' | 'diagnostics' | 'raw' = 'full'
  ) => {
    if (!data.found) {
      if (data.errorType === 'NOT_FOUND') {
        return (
          <div className="space-y-1.5 font-mono text-xs my-1 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg">
            <div className="text-rose-400 font-bold tracking-wider uppercase">JIRA TICKET NOT FOUND</div>
            <div className="text-slate-300">Ticket {requestedTicketId} could not be retrieved.</div>
            <div className="text-slate-500 text-[10px]">
              Please check the ticket identifier or try known incidents: INC-1042, EPL-1067, EPL-1088, INC-1099.
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-1.5 font-mono text-xs my-1 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-lg">
          <div className="text-amber-400 font-bold tracking-wider uppercase">JIRA CONNECTION ERROR</div>
          <div className="text-slate-300">Unable to retrieve ticket data.</div>
          <div className="text-slate-400 text-[10px]">The incident dashboard remains available.</div>
        </div>
      )
    }

    const ticket = data.ticket
    if (!ticket) return null

    // Raw mode: sanitized JSON
    if (mode === 'raw') {
      const sanitized = ticket.raw || {
        id: ticket.id,
        key: ticket.key,
        summary: ticket.summary,
        status: ticket.status,
        priority: ticket.priority,
        route: ticket.route,
        similarity: ticket.similarity,
        assignee: ticket.assignee,
        reporter: ticket.reporter,
        created: ticket.created,
        updated: ticket.updated,
        labels: ticket.labels,
      }
      return (
        <div className="space-y-1 my-1">
          <div className="text-slate-400 text-[10px]">
            [RAW SANITIZED JIRA PAYLOAD — No credentials or tokens exposed]
          </div>
          <pre className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[10px] text-emerald-300 overflow-x-auto max-h-72 font-mono">
            {JSON.stringify(sanitized, null, 2)}
          </pre>
        </div>
      )
    }

    const routeColor =
      ticket.route === 'KNOWN'
        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
        : ticket.route === 'MID'
        ? 'text-amber-400 bg-amber-950/60 border-amber-500/40'
        : ticket.route === 'UNKNOWN'
        ? 'text-rose-400 bg-rose-950/60 border-rose-500/40'
        : 'text-slate-400 bg-slate-900 border-slate-700'

    const isFocused = focusedTicketId === ticket.key

    return (
      <div className="space-y-3 font-mono text-xs my-1 select-text">
        {/* ── ASCII Ticket Card ── */}
        {(mode === 'full' || mode === 'summary') && (
          <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-3 shadow-lg max-w-xl">
            {/* Box Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-bold uppercase text-[10px] tracking-wider">JIRA TICKET</span>
                <span className="text-slate-600">/</span>
                <span className="text-white font-bold text-[12px]">{ticket.key}</span>
                {data.source && (
                  <span className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {data.source}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded uppercase font-bold">
                READ-ONLY
              </span>
            </div>

            {/* Box Body Fields */}
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="grid grid-cols-[80px_1fr] gap-2 py-0.5">
                <span className="text-slate-500">Summary</span>
                <span className="text-slate-200 font-semibold">{ticket.summary}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 py-0.5">
                <span className="text-slate-500">Status</span>
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  {ticket.status}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 py-0.5">
                <span className="text-slate-500">Priority</span>
                <span className="text-amber-300">{ticket.priority}</span>
              </div>
              {ticket.route && (
                <div className="grid grid-cols-[80px_1fr] gap-2 py-0.5 items-center">
                  <span className="text-slate-500">Route</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${routeColor}`}>
                      {ticket.route}
                    </span>
                    {ticket.similarity !== undefined && (
                      <span className="text-[10px] text-slate-400">
                        (Similarity: <strong className="text-emerald-400">{ticket.similarity.toFixed(2)}</strong>)
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-[80px_1fr] gap-2 py-0.5">
                <span className="text-slate-500">Assignee</span>
                <span className="text-slate-200">{ticket.assignee}</span>
              </div>
              {ticket.reporter && (
                <div className="grid grid-cols-[80px_1fr] gap-2 py-0.5">
                  <span className="text-slate-500">Reporter</span>
                  <span className="text-slate-400">{ticket.reporter}</span>
                </div>
              )}
            </div>

            {/* ── VIEW ON FLOOR ACTION BUTTON ── */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => handleViewOnFloor(ticket)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer shadow-sm ${
                  isFocused
                    ? 'bg-emerald-600 text-white border border-emerald-400 animate-pulse'
                    : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 hover:border-purple-400'
                }`}
              >
                <ExternalLink size={10} />
                <span>{isFocused ? '✓ FOCUSED ON FLOOR' : 'VIEW ON FLOOR'}</span>
              </button>
              <span className="text-[9px] text-slate-500">Loads state & highlights route without re-executing</span>
            </div>
          </div>
        )}

        {/* ── Diagnostic Steps Section ── */}
        {(mode === 'full' || mode === 'diagnostics') && (
          <div className="space-y-1 pt-1">
            <div className="text-purple-300 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <span>DIAGNOSTIC STEPS</span>
            </div>
            {ticket.diagnosticSteps && ticket.diagnosticSteps.length > 0 ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1 text-[11px]">
                {ticket.diagnosticSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-slate-500 flex-shrink-0 w-4 font-mono">{idx + 1}.</span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic text-[11px] bg-slate-950/40 p-2 rounded border border-slate-900">
                Not available in JIRA.
              </div>
            )}
          </div>
        )}

        {/* ── Diagnostic Timeline Section ── */}
        {(mode === 'full' || mode === 'diagnostics') && ticket.diagnosticTimeline && ticket.diagnosticTimeline.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="text-purple-300 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <span>DIAGNOSTIC TIMELINE</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5 text-[11px]">
              {ticket.diagnosticTimeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300 border-b border-slate-900/60 pb-1 last:border-0">
                  <span className="text-slate-500 font-mono text-[9px] pt-0.5 flex-shrink-0">
                    [{item.timestamp}]
                  </span>
                  <span className="text-sky-400 font-bold flex-shrink-0 text-[10px]">
                    {item.source}
                  </span>
                  <span className="text-slate-300 leading-snug break-words">
                    {item.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Root Cause, Resolution, Verification, Knowledge ── */}
        {mode === 'full' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
            {ticket.rootCause && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-0.5">
                <div className="text-amber-400 font-bold uppercase text-[9px] tracking-wider">ROOT CAUSE</div>
                <div className="text-slate-300 leading-snug">{ticket.rootCause}</div>
              </div>
            )}
            {ticket.resolutionDetails && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-0.5">
                <div className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider">RESOLUTION</div>
                <div className="text-slate-300 leading-snug">{ticket.resolutionDetails}</div>
              </div>
            )}
            {ticket.verification && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-0.5">
                <div className="text-sky-400 font-bold uppercase text-[9px] tracking-wider">VERIFICATION</div>
                <div className="text-slate-300 leading-snug">{ticket.verification}</div>
              </div>
            )}
            {ticket.knowledge && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-0.5">
                <div className="text-purple-300 font-bold uppercase text-[9px] tracking-wider">KNOWLEDGE</div>
                <div className="text-slate-300 leading-snug">{ticket.knowledge}</div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Command Dispatcher ───────────────────────────────────────────────────
  const handleCommand = async (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    setCmdHistory((prev) => [...prev, raw])
    setHistoryIdx(-1)

    const cmdLower = trimmed.toLowerCase()
    const tokens = trimmed.split(/\s+/)
    const baseCmd = tokens[0].toLowerCase()

    // Append input line
    setHistory((prev) => [
      ...prev,
      { id: crypto.randomUUID(), command: raw, output: '', type: 'input' },
    ])

    // ── JIRA / TICKET / DIAGNOSE RETRIEVAL COMMANDS ────────────────────────
    if (baseCmd === 'jira' || baseCmd === 'ticket' || baseCmd === 'diagnose') {
      const ticketId = tokens[1]

      if (!ticketId || ticketId.startsWith('--')) {
        setHistory((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            output: (
              <div className="space-y-1.5 text-slate-300">
                <div className="text-amber-400 font-bold">JIRA Ticket Diagnostic Retrieval (Read-Only)</div>
                <div className="text-slate-400 text-[11px]">
                  Retrieve JIRA ticket diagnostic and resolution data directly in the terminal without modifying tickets.
                </div>
                <div className="space-y-0.5 text-[11px] font-mono mt-1">
                  <div><span className="text-sky-300 font-bold">jira &lt;TICKET_ID&gt;</span> — Complete ticket summary + diagnostics</div>
                  <div><span className="text-sky-300 font-bold">ticket &lt;TICKET_ID&gt;</span> — Alias for jira command</div>
                  <div><span className="text-sky-300 font-bold">diagnose &lt;TICKET_ID&gt;</span> — Diagnostic timeline and root cause focus</div>
                  <div><span className="text-sky-300 font-bold">jira &lt;TICKET_ID&gt; --summary</span> — Compact ticket summary only</div>
                  <div><span className="text-sky-300 font-bold">jira &lt;TICKET_ID&gt; --diagnostics</span> — Diagnostic steps & timeline only</div>
                  <div><span className="text-sky-300 font-bold">jira &lt;TICKET_ID&gt; --raw</span> — Sanitized raw ticket payload</div>
                </div>
                <div className="text-slate-500 text-[10px] mt-1">
                  Available demo tickets: <span className="text-purple-300">INC-1042</span>, <span className="text-purple-300">EPL-1067</span>, <span className="text-purple-300">EPL-1088</span>, <span className="text-purple-300">INC-1099</span>.
                </div>
              </div>
            ),
          },
        ])
        return
      }

      // Check flags
      const isRaw = tokens.includes('--raw')
      const isSummary = tokens.includes('--summary')
      const isDiagnostics = tokens.includes('--diagnostics') || baseCmd === 'diagnose'
      const viewMode: 'full' | 'summary' | 'diagnostics' | 'raw' = isRaw
        ? 'raw'
        : isSummary
        ? 'summary'
        : isDiagnostics
        ? 'diagnostics'
        : 'full'

      // Loading entry
      const loadingId = crypto.randomUUID()
      setHistory((prev) => [
        ...prev,
        {
          id: loadingId,
          output: (
            <div className="text-slate-400 text-[11px] flex items-center gap-1.5 animate-pulse">
              <span className="text-purple-400 font-bold">[JIRA]</span>
              <span>Retrieving ticket {ticketId.toUpperCase()} diagnostic data...</span>
            </div>
          ),
        },
      ])

      try {
        const res = await fetch(`/api/jira/ticket?id=${encodeURIComponent(ticketId)}`, {
          method: 'GET',
          cache: 'no-store',
        })
        const data: JiraApiResponse = await res.json()

        setHistory((prev) =>
          prev.map((item) =>
            item.id === loadingId
              ? {
                  ...item,
                  output: renderJiraResponse(data, ticketId.toUpperCase(), viewMode),
                }
              : item
          )
        )
      } catch (err) {
        setHistory((prev) =>
          prev.map((item) =>
            item.id === loadingId
              ? {
                  ...item,
                  output: (
                    <div className="space-y-1 font-mono text-xs my-1 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-lg">
                      <div className="text-amber-400 font-bold uppercase">JIRA CONNECTION ERROR</div>
                      <div className="text-slate-300">Unable to retrieve ticket data.</div>
                      <div className="text-slate-400 text-[10px]">The incident dashboard remains available.</div>
                    </div>
                  ),
                }
              : item
          )
        )
      }
      return
    }

    // ── STANDARD TERMINAL COMMANDS ─────────────────────────────────────────
    const newItems: CommandHistoryItem[] = []

    switch (cmdLower) {
      case 'help':
        newItems.push({
          id: crypto.randomUUID(),
          output: (
            <div className="space-y-1.5 text-slate-300">
              <div className="text-purple-300 font-bold">FixFlow Operations Terminal Commands:</div>
              <div className="grid grid-cols-[160px_1fr] gap-1 text-[11px]">
                <span className="text-sky-300 font-bold">jira &lt;TICKET_ID&gt;</span>
                <span>Retrieve JIRA ticket diagnostics & resolution (Read-Only)</span>

                <span className="text-sky-300 font-bold">diagnose &lt;TICKET_ID&gt;</span>
                <span>Focus on diagnostic timeline for a ticket</span>

                <span className="text-sky-300 font-bold">status</span>
                <span>Display system & active incident health</span>

                <span className="text-sky-300 font-bold">scenario known</span>
                <span>Run Known Scenario (VPN Auth Failure, David)</span>

                <span className="text-sky-300 font-bold">scenario mid</span>
                <span>Run Mid Scenario (DB Pool, Human Decision)</span>

                <span className="text-sky-300 font-bold">scenario unknown</span>
                <span>Run Unknown Scenario (P1 Deadlock, Marcus & Arjun)</span>

                <span className="text-sky-300 font-bold">scenario failure</span>
                <span>Run Graceful Failure (Insufficient Evidence)</span>

                <span className="text-sky-300 font-bold">scenario replay</span>
                <span>Run Closed-Loop Replay (Learned Pattern)</span>

                <span className="text-sky-300 font-bold">people</span>
                <span>List internal team roster (10 members + client)</span>

                <span className="text-sky-300 font-bold">events</span>
                <span>Display recent timeline events</span>

                <span className="text-sky-300 font-bold">knowledge</span>
                <span>Show Knowledge Base vector stats</span>

                <span className="text-sky-300 font-bold">reset</span>
                <span>Reset the operations floor to standby</span>

                <span className="text-sky-300 font-bold">clear</span>
                <span>Clear terminal console</span>
              </div>
            </div>
          ),
        })
        break

      case 'status':
        newItems.push({
          id: crypto.randomUUID(),
          output: (
            <div className="space-y-0.5 text-slate-300">
              <div className="text-emerald-400 font-bold">FixFlow Status:</div>
              <div>  Mode:            <span className="text-sky-400 font-bold">{sim.mode}</span></div>
              <div>  Incident ID:     <span className="text-purple-300 font-bold">{sim.incidentId || 'None (Standby)'}</span></div>
              <div>  Active Stage:    <span className="text-white uppercase font-bold">{sim.currentStage}</span></div>
              <div>  Route:           <span className="text-amber-400 font-bold uppercase">{sim.route || 'Standby'}</span></div>
              <div>  Similarity:      <span className="text-emerald-400 font-bold">{sim.similarity !== null ? sim.similarity.toFixed(2) : '--'}</span></div>
              <div>  Assigned Human:  <span className="text-slate-200">{sim.assignedHuman || 'None'}</span></div>
              <div>  State:           <span className="text-emerald-400 uppercase font-bold">{sim.status}</span></div>
              <div>  Floor Scene:     <span className="text-emerald-400 font-bold">OPERATIONAL</span></div>
            </div>
          ),
        })
        break

      case 'scenario known':
        sim.runKnownScenario()
        newItems.push({
          id: crypto.randomUUID(),
          output: <div className="text-emerald-400 font-bold">Starting KNOWN incident simulation (INC-1042 — VPN Auth Failure)...</div>,
          type: 'success',
        })
        break

      case 'scenario mid':
        sim.runMidScenario()
        newItems.push({
          id: crypto.randomUUID(),
          output: <div className="text-amber-400 font-bold">Starting MID incident simulation (EPL-1067 — DB Connection Timeout)...</div>,
          type: 'success',
        })
        break

      case 'scenario unknown':
        sim.runUnknownScenario()
        newItems.push({
          id: crypto.randomUUID(),
          output: <div className="text-rose-400 font-bold">Starting UNKNOWN novel incident simulation (EPL-1088 — Cross-Cluster Deadlock)...</div>,
          type: 'success',
        })
        break

      case 'scenario failure':
      case 'scenario fail':
        sim.runFailureScenario?.()
        newItems.push({
          id: crypto.randomUUID(),
          output: <div className="text-amber-400 font-bold">Starting GRACEFUL FAILURE simulation (Insufficient Evidence & Human Review)...</div>,
          type: 'success',
        })
        break

      case 'scenario replay':
        sim.runReplayScenario()
        newItems.push({
          id: crypto.randomUUID(),
          output: <div className="text-emerald-400 font-bold">Starting CLOSED-LOOP REPLAY simulation (Learned Pattern 0.41 → 0.94)...</div>,
          type: 'success',
        })
        break

      case 'people':
        newItems.push({
          id: crypto.randomUUID(),
          output: (
            <div className="space-y-0.5 text-slate-300">
              <div className="text-purple-300 font-bold">FixFlow Core Engineering Team (10 Internal + 1 Client):</div>
              <div>  [Manager]    Elena Rodriguez     Incident Manager</div>
              <div>  [Backend]    David Chen          Backend Engineer</div>
              <div>  [Frontend]   Priya Sharma        Frontend Engineer</div>
              <div>  [Payments]   Arjun Mehta         Payments Engineer</div>
              <div>  [Platform]   Sofia Rossi         Platform Engineer</div>
              <div>  [Software]   Daniel Kim          Software Engineer</div>
              <div>  [DevOps/SRE] Marcus Lee          DevOps / SRE</div>
              <div>  [QA Lead]    Maya Patel          QA Lead</div>
              <div>  [QA Eng]     Noah Williams       QA Engineer</div>
              <div>  [Auto QA]    Ananya Sen          Automation Tester</div>
              <div>  [Visitor]    Client              External Customer (Visitor Reception)</div>
            </div>
          ),
        })
        break

      case 'events':
        newItems.push({
          id: crypto.randomUUID(),
          output: (
            <div className="space-y-1">
              <div className="text-purple-300 font-bold">Recent Timeline Events ({sim.timeline.length}):</div>
              {sim.timeline.length > 0 ? (
                sim.timeline.slice(-8).map((e) => (
                  <div key={e.id} className="text-[11px] text-slate-400">
                    <span className="text-slate-500 font-mono">[{e.timestamp}]</span>{' '}
                    <span className="text-slate-200">{e.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">No events recorded. System standby.</div>
              )}
            </div>
          ),
        })
        break

      case 'knowledge':
        newItems.push({
          id: crypto.randomUUID(),
          output: (
            <div className="space-y-0.5 text-slate-300">
              <div className="text-emerald-400 font-bold">Knowledge Base & Vector Store:</div>
              <div>  Index:           <span className="text-white">pgvector HNSW (cosine)</span></div>
              <div>  Embedding Model: <span className="text-white">text-embedding-3-small (1536 dims)</span></div>
              <div>  Known Matches:   <span className="text-emerald-400 font-bold">KB-089 (0.94), KB-074 (0.72)</span></div>
              <div>  Learned Entry:   <span className="text-purple-300 font-bold">KB-1250: Deterministic Lock Ordering</span></div>
              <div>  Closed Loop:     <span className="text-emerald-400">Active</span></div>
            </div>
          ),
        })
        break

      case 'reset':
        sim.reset()
        newItems.push({
          id: crypto.randomUUID(),
          output: <div className="text-slate-400">Floor scene and simulation engine reset to STANDBY.</div>,
        })
        break

      case 'clear':
        setHistory([])
        return

      default:
        newItems.push({
          id: crypto.randomUUID(),
          output: <div className="text-red-400">Unknown command: &apos;{raw}&apos;. Type &apos;help&apos; for available commands.</div>,
          type: 'error',
        })
        break
    }

    setHistory((prev) => [...prev, ...newItems])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = inputVal
      setInputVal('')
      handleCommand(val)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1)
        setHistoryIdx(nextIdx)
        setInputVal(cmdHistory[nextIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1
        if (nextIdx >= cmdHistory.length) {
          setHistoryIdx(-1)
          setInputVal('')
        } else {
          setHistoryIdx(nextIdx)
          setInputVal(cmdHistory[nextIdx])
        }
      }
    }
  }

  return (
    <div
      className={`fixed z-50 bg-[#040711] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col font-mono text-xs overflow-hidden transition-all duration-200 ${
        isMaximized
          ? 'inset-6'
          : 'bottom-4 right-4 w-[560px] max-w-[calc(100vw-32px)] h-[440px]'
      }`}
    >
      {/* ── Terminal Titlebar ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 select-none flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-purple-400" />
          <span className="font-bold text-white text-[11px]">FixFlow Terminal</span>
          <span className="text-[9px] text-slate-500 font-mono">Operations Console</span>
          <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
            JIRA READ-ONLY
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minus size={11} /> : <Square size={10} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
            title="Close Terminal"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ── Terminal Output History ── */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-[11px] leading-relaxed select-text">
        {history.map((item) => (
          <div key={item.id}>
            {item.command && (
              <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                <span className="text-slate-600">&gt;</span>
                <span>{item.command}</span>
              </div>
            )}
            {item.output && <div className="mt-0.5">{item.output}</div>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* ── Command Input Prompt ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/90 border-t border-slate-800/80 flex-shrink-0">
        <span className="text-purple-400 font-bold">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type 'jira INC-1042' or 'help'..."
          className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder:text-slate-600"
          autoFocus
        />
        <span className="text-[9px] text-slate-500 font-mono">ENTER to run</span>
      </div>
    </div>
  )
}
