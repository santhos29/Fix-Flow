/**
 * FixFlow — Deterministic Incident Simulation Engine
 * 
 * Centralized, typed finite state machine driving:
 * - 10 Human team members + 1 Client visitor:
 *   Elena, David, Priya, Arjun, Sofia, Daniel, Maya, Noah, Ananya, Marcus, Client.
 * - Realistic office interaction:
 *   1. Client arrives at Reception / Visiting Hall
 *   2. Elena physically walks to Reception to meet Client
 *   3. Client hands off physical animated incident envelope to Elena
 *   4. Elena evaluates classification and physically walks to the assigned engineer
 *   5. Engineer acknowledges assignment and walks to workstation/playbook
 *   6. QA verifies
 *   7. Engineer reports to Elena
 *   8. Elena confirms: SITE LIVE!
 *   9. Everyone returns home smoothly
 * - Synced Live Event Feed with [SIMULATION] / [LIVE EXECUTION] tag.
 */
import { create } from 'zustand'

export type ExecutionMode = 'SIMULATION' | 'LIVE'
export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'
export type IncidentRoute = 'known' | 'mid' | 'unknown'

export type IncidentStatus =
  | 'idle'
  | 'received'
  | 'normalizing'
  | 'embedding'
  | 'searching'
  | 'routing'
  | 'awaiting_human'
  | 'investigating'
  | 'executing'
  | 'verifying'
  | 'resolved'
  | 'knowledge_capture'
  | 'failed'

export type CanonicalStage =
  | 'idle'
  | 'received'
  | 'normalized'
  | 'embedded'
  | 'knowledge_search'
  | 'routing'
  | 'remediation'
  | 'verification'
  | 'resolution'
  | 'knowledge_capture'

export type StationId =
  | 'commander'
  | 'intake'
  | 'semantic'
  | 'knowledge_search'
  | 'routing'
  | 'developer_david'
  | 'developer_priya'
  | 'developer_arjun'
  | 'developer_sofia'
  | 'developer_daniel'
  | 'devops_marcus'
  | 'devops_infra'
  | 'ai_diagnostics'
  | 'qa_maya'
  | 'qa_noah'
  | 'qa_ananya'
  | 'qa_testing'
  | 'playbook'
  | 'verification'
  | 'resolution'
  | 'knowledge_lab'
  | 'client_entrance'
  | 'client_reception'
  | 'reception_meet'

export type HumanRole =
  | 'elena'
  | 'david'
  | 'priya'
  | 'arjun'
  | 'sofia'
  | 'daniel'
  | 'maya'
  | 'noah'
  | 'ananya'
  | 'marcus'
  | 'client'

export type EventType =
  | 'incident_received'
  | 'incident_normalized'
  | 'embedding_generated'
  | 'knowledge_search_completed'
  | 'routing_decision'
  | 'station_activated'
  | 'human_assigned'
  | 'human_accepted'
  | 'task_bubble_shown'
  | 'playbook_started'
  | 'playbook_step_completed'
  | 'verification_started'
  | 'verification_passed'
  | 'verification_failed'
  | 'incident_resolved'
  | 'knowledge_candidate_created'
  | 'knowledge_approved'

export interface IncidentEvent {
  id: string
  type: EventType
  incidentId: string
  timestamp: string
  stage: CanonicalStage
  station?: StationId
  actor?: string
  message: string
  metadata?: Record<string, unknown>
}

export interface IncidentState {
  incidentId: string | null
  title: string | null
  severity: IncidentSeverity | null
  similarity: number | null
  route: IncidentRoute | null
  currentStage: CanonicalStage
  currentStation: StationId | null
  status: IncidentStatus
  mode: ExecutionMode
  assignedHuman: HumanRole | null
  playbookId: string | null
  verificationStatus: 'pending' | 'verifying' | 'passed' | 'failed'
  knowledgeCandidate: {
    id: string
    title: string
    resolution: string
    similarityBefore: number
    similarityAfter: number
  } | null
  timeline: IncidentEvent[]
  startedAt: string | null
  completedAt: string | null
  clientName?: string
  clientRole?: string
  activeLogSnippet?: string
  activeMetrics?: {
    latencyBefore: number
    latencyAfter: number
    errorRateBefore: number
    errorRateAfter: number
    saturationBefore: number
    saturationAfter: number
  }
}

export interface FloorObserver {
  onStationTransition?: (station: StationId, incidentId: string) => void
  onRouteSelected?: (route: IncidentRoute) => void
  onHumanStateChange?: (human: HumanRole, state: 'idle' | 'alerted' | 'standing' | 'walking' | 'working' | 'talking' | 'waiting' | 'entering' | 'handing_over' | 'reviewing' | 'investigating' | 'approved' | 'success' | 'returning') => void
  onHumanWalk?: (human: HumanRole, station: StationId, taskBubble?: string) => Promise<void>
  onWalkCharacterToCharacter?: (src: HumanRole, dst: HumanRole, taskBubble?: string) => Promise<void>
  onHumanBubble?: (human: HumanRole, text: string, type?: string) => void
  onHumanReturnHome?: (human: HumanRole) => Promise<void>
  onKnowledgeBubble?: () => void
  onResetScene?: () => void
  onClientArrive?: (name?: string, role?: string) => Promise<void>
  onClientExit?: () => Promise<void>
  onClientMail?: () => Promise<void>
  onMailNotification?: (title: string, incidentId: string, severity: string) => void
  onDevOpsHighActivity?: (active: boolean) => void
}

export interface SimulationEngineStore extends IncidentState {
  isPlaying: boolean
  replayBanner: string | null
  executionSpeedMs: number

  setMode: (mode: ExecutionMode) => void
  setSpeed: (ms: number) => void
  reset: () => void

  runKnownScenario: (override?: Partial<CorrectiveIncidentDefinition> & { clientName?: string; clientRole?: string }) => Promise<void>
  runMidScenario: (onAwaitingDecision?: () => void, override?: Partial<CorrectiveIncidentDefinition> & { clientName?: string; clientRole?: string }) => Promise<void>
  runUnknownScenario: (onAwaitingApproval?: () => void, override?: Partial<CorrectiveIncidentDefinition> & { clientName?: string; clientRole?: string }) => Promise<void>
  runReplayScenario: () => Promise<void>
  runFailureScenario: (override?: Partial<CorrectiveIncidentDefinition> & { clientName?: string; clientRole?: string }) => Promise<void>
  runRandomCorrectiveScenario: (onAwaitingDecision?: () => void, onAwaitingApproval?: () => void) => Promise<void>
  loadTicketForInspection: (ticket: {
    id: string
    title: string
    route?: 'known' | 'mid' | 'unknown'
    similarity?: number
    assignedHuman?: HumanRole | string
    status?: string
    priority?: string
    timeline?: IncidentEvent[]
  }) => void

  approveHumanFix: () => Promise<void>
  approveElenaSignoff: () => Promise<void>

  registerFloorObserver: (observer: FloorObserver) => () => void
}

export interface CorrectiveIncidentDefinition {
  id: string
  title: string
  service: string
  category: 'Backend' | 'Database' | 'Infrastructure' | 'Cache' | 'Streaming' | 'Security'
  priority: IncidentSeverity
  route: IncidentRoute
  similarity: number
  description: string
  playbookId?: string
  logSnippet: string
  rootCause: string
  resolution: string
  latencyBefore: number
  latencyAfter: number
  errorRateBefore: number
  errorRateAfter: number
  saturationBefore: number
  saturationAfter: number
}

export const CLIENT_PERSONAS = [
  { name: 'Sarah Lin', role: 'VP Engineering, CloudScale' },
  { name: 'Robert Chen', role: 'Ops Director, RetailCorp' },
  { name: 'Marcus Brody', role: 'FinPay Infra Lead' },
  { name: 'Amina Morales', role: 'Head of Cloud Infra, DataFlow' },
  { name: 'James Wilson', role: 'Lead Architect, LogisticsX' },
  { name: 'Chloe Dupont', role: 'Staff SRE, PayGlobal' },
]

export const CORRECTIVE_MAINTENANCE_POOL: CorrectiveIncidentDefinition[] = [
  {
    id: 'INC-1042',
    title: 'VPN Gateway Session Cache Invalidation',
    service: 'Gateway Auth Daemon',
    category: 'Backend',
    priority: 'P2',
    route: 'known',
    similarity: 0.94,
    description: 'VPN auth daemon returning invalid session handshake. High concurrency token expiry triggering connection drops.',
    playbookId: 'VPN-AUTH-01',
    logSnippet: 'SessionAuthError: Handshake token 0x8f2 expired prematurely. 142 clients dropped in 30s.',
    rootCause: 'Stale session cache caused token invalidation race under concurrency.',
    resolution: 'Flushed Redis session cache and restarted auth daemon.',
    latencyBefore: 1420,
    latencyAfter: 12,
    errorRateBefore: 18.4,
    errorRateAfter: 0.00,
    saturationBefore: 94,
    saturationAfter: 8,
  },
  {
    id: 'EPL-1067',
    title: 'Database Connection Pool Exhaustion on Checkout',
    service: 'Checkout DB Cluster',
    category: 'Database',
    priority: 'P1',
    route: 'mid',
    similarity: 0.78,
    description: 'PostgreSQL connection pool exhausted at 100% capacity under batch order processing, causing HTTP 504 timeouts.',
    playbookId: 'DB-POOL-RESIZE',
    logSnippet: 'TimeoutException: Connection acquisition timed out after 30000ms [active=30, idle=0, waiting=184].',
    rootCause: 'Batch checkout transactions holding idle-in-transaction locks without timeout.',
    resolution: 'Drained saturated pool, expanded max_pool_size from 30 to 90, and set statement_timeout to 8s.',
    latencyBefore: 3120,
    latencyAfter: 24,
    errorRateBefore: 32.1,
    errorRateAfter: 0.00,
    saturationBefore: 100,
    saturationAfter: 18,
  },
  {
    id: 'EPL-1088',
    title: 'Cross-Cluster Distributed Lock Deadlock',
    service: 'Payment Transaction Engine',
    category: 'Infrastructure',
    priority: 'P1',
    route: 'unknown',
    similarity: 0.41,
    description: 'Circular lock wait detected between inventory reservations and payment settlements under distributed transaction commit.',
    playbookId: 'DEADLOCK-BREAK-TX',
    logSnippet: 'DeadlockDetected: Transaction 8412 waiting on ShareLock for relation inventory held by 8419.',
    rootCause: 'Inconsistent locking order between inventory and ledger microservices.',
    resolution: 'Enforced sorted primary-key locking hierarchy and released deadlock cycle.',
    latencyBefore: 8540,
    latencyAfter: 42,
    errorRateBefore: 45.6,
    errorRateAfter: 0.01,
    saturationBefore: 98,
    saturationAfter: 22,
  },
  {
    id: 'EPL-1099',
    title: 'Cryptographic Signature Verification Anomaly',
    service: 'Security Handshake Gateway',
    category: 'Security',
    priority: 'P1',
    route: 'unknown',
    similarity: 0.28,
    description: 'Anomaly in cryptographic signature exchange causing cascading validation failures across edge ingress nodes.',
    logSnippet: 'CryptoSignatureVerificationFailed: Algorithm curve secp256k1 digest mismatch on payload block 94.',
    rootCause: 'Corrupted public key bundle propagation across edge nodes.',
    resolution: 'Manual forensic review completed; rolled back edge key distribution.',
    latencyBefore: 2400,
    latencyAfter: 18,
    errorRateBefore: 100.0,
    errorRateAfter: 0.00,
    saturationBefore: 88,
    saturationAfter: 12,
  },
  {
    id: 'INC-2014',
    title: 'Redis Cluster Memory Saturation & Cache Stampede',
    service: 'Product Catalog Cache',
    category: 'Cache',
    priority: 'P2',
    route: 'known',
    similarity: 0.92,
    description: 'Simultaneous TTL expiration on top-100 product categories causing direct database hammering and Redis OOM alerts.',
    playbookId: 'CACHE-WARM-TTL',
    logSnippet: 'OOM command not allowed when used memory > maxmemory (98.4% used of 16GB).',
    rootCause: 'Synchronized TTLs without jitter caused instantaneous cache stampede.',
    resolution: 'Applied probabilistic early expiration with jitter and doubled Redis maxmemory.',
    latencyBefore: 1890,
    latencyAfter: 8,
    errorRateBefore: 22.8,
    errorRateAfter: 0.00,
    saturationBefore: 98,
    saturationAfter: 34,
  },
  {
    id: 'INC-2028',
    title: 'Kafka Consumer Group Partition Rebalance Infinite Loop',
    service: 'Event Ingestion Pipeline',
    category: 'Streaming',
    priority: 'P2',
    route: 'mid',
    similarity: 0.74,
    description: 'Long-running deserialization tasks exceeding max.poll.interval.ms, causing recurring partition rebalancing and lag spikes.',
    playbookId: 'KAFKA-REBALANCE-FIX',
    logSnippet: 'CommitFailedException: Offset commit cannot be completed since group has already rebalanced.',
    rootCause: 'Heavy batch processing exceeded consumer heartbeat timeout.',
    resolution: 'Increased max.poll.interval.ms to 600s and decreased max.poll.records to 250.',
    latencyBefore: 4200,
    latencyAfter: 35,
    errorRateBefore: 15.2,
    errorRateAfter: 0.00,
    saturationBefore: 89,
    saturationAfter: 20,
  },
  {
    id: 'INC-2035',
    title: 'Nginx Reverse Proxy Buffer Overflow on Ingress',
    service: 'Edge Ingress Gateway',
    category: 'Infrastructure',
    priority: 'P2',
    route: 'known',
    similarity: 0.88,
    description: 'Large upstream response headers exceeding proxy_buffer_size causing HTTP 502 Bad Gateway errors on mobile clients.',
    playbookId: 'NGINX-BUFFER-TUNE',
    logSnippet: 'upstream sent too big header while reading response header from upstream, client: 10.0.4.12.',
    rootCause: 'Header payload exceeded default 4k buffer allocation.',
    resolution: 'Increased proxy_buffer_size to 16k and proxy_buffers to 4 32k in nginx ingress.',
    latencyBefore: 1100,
    latencyAfter: 14,
    errorRateBefore: 12.4,
    errorRateAfter: 0.00,
    saturationBefore: 85,
    saturationAfter: 11,
  },
  {
    id: 'INC-2041',
    title: 'JWT Refresh Token Concurrency Race Condition',
    service: 'Identity Microservice',
    category: 'Backend',
    priority: 'P2',
    route: 'mid',
    similarity: 0.76,
    description: 'Parallel frontend requests during token expiry trigger double-refresh, revoking valid refresh tokens and forcing user logout.',
    playbookId: 'AUTH-RACE-MUTEX',
    logSnippet: 'InvalidRefreshTokenException: Token family reuse detected, revoking all tokens for subject.',
    rootCause: 'Lack of distributed mutex lock on refresh token rotation endpoint.',
    resolution: 'Added a 15-second grace period for rotated refresh tokens and implemented frontend mutex.',
    latencyBefore: 2150,
    latencyAfter: 16,
    errorRateBefore: 28.0,
    errorRateAfter: 0.00,
    saturationBefore: 92,
    saturationAfter: 15,
  }
]

let clientRotationIndex = 0
let incidentRotationIndex = 0

const INITIAL_STATE: IncidentState = {
  incidentId: null,
  title: null,
  severity: null,
  similarity: null,
  route: null,
  currentStage: 'idle',
  currentStation: null,
  status: 'idle',
  mode: 'SIMULATION',
  assignedHuman: null,
  playbookId: null,
  verificationStatus: 'pending',
  knowledgeCandidate: null,
  timeline: [],
  startedAt: null,
  completedAt: null,
}

const observers: Set<FloorObserver> = new Set()

const formatTime = () => {
  const d = new Date()
  return d.toTimeString().split(' ')[0]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useIncidentSimulationEngine = create<SimulationEngineStore>((set, get) => ({
  ...INITIAL_STATE,
  isPlaying: false,
  replayBanner: null,
  executionSpeedMs: 450,

  setMode: (mode) => set({ mode }),
  setSpeed: (executionSpeedMs) => set({ executionSpeedMs }),

  registerFloorObserver: (observer) => {
    observers.add(observer)
    return () => {
      observers.delete(observer)
    }
  },

  reset: () => {
    observers.forEach((obs) => {
      obs.onResetScene?.()
      obs.onClientExit?.()
      obs.onDevOpsHighActivity?.(false)
    })
    set({
      ...INITIAL_STATE,
      isPlaying: false,
      replayBanner: null,
    })
  },

  loadTicketForInspection: (ticket) => {
    const normRoute = (ticket.route?.toLowerCase() as IncidentRoute) || 'known'
    let role: HumanRole = 'elena'
    const assignStr = String(ticket.assignedHuman || '').toLowerCase()
    if (assignStr.includes('david')) role = 'david'
    else if (assignStr.includes('marcus')) role = 'marcus'
    else if (assignStr.includes('arjun')) role = 'arjun'
    else if (assignStr.includes('sofia')) role = 'sofia'

    observers.forEach((obs) => {
      obs.onRouteSelected?.(normRoute)
      obs.onHumanStateChange?.(role, 'working')
    })

    set({
      incidentId: ticket.id,
      title: ticket.title,
      route: normRoute,
      similarity: ticket.similarity ?? (normRoute === 'known' ? 0.94 : normRoute === 'mid' ? 0.78 : 0.41),
      assignedHuman: role,
      severity: (ticket.priority?.toUpperCase().includes('P1') || ticket.priority?.toUpperCase().includes('CRIT') ? 'P1' : 'P2') as IncidentSeverity,
      status: (ticket.status?.toLowerCase().includes('res') || ticket.status?.toLowerCase().includes('done') ? 'resolved' : 'investigating') as IncidentStatus,
      currentStage: (ticket.status?.toLowerCase().includes('res') || ticket.status?.toLowerCase().includes('done') ? 'resolution' : 'routing') as CanonicalStage,
      currentStation: normRoute === 'known' ? 'playbook' : normRoute === 'mid' ? 'routing' : 'ai_diagnostics',
      isPlaying: false,
      timeline: ticket.timeline && ticket.timeline.length > 0 ? ticket.timeline : get().timeline,
    })
  },

  // ── 1. KNOWN SCENARIO (0.94 Match — VPN Auth Failure, Assigned to David) ────────
  runKnownScenario: async (override) => {
    const s = get()
    if (s.isPlaying) return

    get().reset()
    const client = override?.clientName
      ? { name: override.clientName, role: override.clientRole || 'External Customer' }
      : CLIENT_PERSONAS[clientRotationIndex++ % CLIENT_PERSONAS.length]

    const incidentId = override?.id || 'INC-1042'
    const title = override?.title || 'VPN Authentication Failure'
    const similarity = override?.similarity ?? 0.94
    const severity = override?.priority || 'P3'
    const playbookId = override?.playbookId || 'VPN-AUTH-01'
    const now = formatTime()
    const delay = s.executionSpeedMs

    set({
      isPlaying: true,
      incidentId,
      title,
      severity,
      similarity,
      route: 'known',
      assignedHuman: 'david',
      playbookId,
      mode: 'SIMULATION',
      startedAt: now,
      status: 'received',
      currentStage: 'received',
      currentStation: 'intake',
      clientName: client.name,
      clientRole: client.role,
      activeLogSnippet: override?.logSnippet || 'SessionAuthError: Handshake token 0x8f2 expired prematurely. 142 clients dropped.',
      activeMetrics: {
        latencyBefore: override?.latencyBefore || 1420,
        latencyAfter: override?.latencyAfter || 12,
        errorRateBefore: override?.errorRateBefore || 18.4,
        errorRateAfter: override?.errorRateAfter || 0.0,
        saturationBefore: override?.saturationBefore || 94,
        saturationAfter: override?.saturationAfter || 8,
      },
    })

    // 1. Client arrives from entrance to reception desk
    for (const obs of observers) {
      if (obs.onClientArrive) await obs.onClientArrive(client.name, client.role)
    }
    const event0: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'client_reception',
      message: `[SIMULATION] Client ${client.name} arrived at Visitor Reception Hall`,
    }
    set(state => ({ timeline: [...state.timeline, event0] }))

    observers.forEach(obs => {
      obs.onHumanStateChange?.('client', 'waiting')
      obs.onHumanBubble?.('client', `${title}: urgent production outage!`, 'alert')
    })
    await sleep(delay + 200)

    // 2. Elena notified, walks to Reception to meet Client
    observers.forEach(obs => {
      obs.onHumanStateChange?.('elena', 'alerted')
    })
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('elena', 'reception_meet')
    }
    observers.forEach(obs => {
      obs.onHumanStateChange?.('elena', 'talking')
    })

    // 3. Client hands over envelope to Elena in Reception
    for (const obs of observers) {
      if (obs.onClientMail) await obs.onClientMail()
    }
    const event1: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'intake',
      message: `[SIMULATION] Incident received from Client: ${incidentId} — ${title}`,
    }
    set(state => ({ timeline: [...state.timeline, event1] }))

    observers.forEach(obs => {
      obs.onMailNotification?.(title, incidentId, severity)
      obs.onHumanBubble?.('elena', 'Incident received. Evaluating classification...', 'status')
    })
    await sleep(delay + 300)

    // Elena reviewing classification
    const eventEval: IncidentEvent = {
      id: crypto.randomUUID(), type: 'routing_decision', incidentId,
      timestamp: formatTime(), stage: 'routing', station: 'routing',
      message: `[SIMULATION] Elena evaluated classification: ${override?.category || 'Backend'} Incident. Assigning David Chen.`,
    }
    set(state => ({ timeline: [...state.timeline, eventEval] }))

    // 4. Software Stations: Intake -> Semantic -> Knowledge Search
    observers.forEach(obs => obs.onRouteSelected?.('known'))
    observers.forEach(obs => obs.onStationTransition?.('intake', incidentId))
    await sleep(delay)

    set({ status: 'normalizing', currentStage: 'normalized', currentStation: 'semantic' })
    observers.forEach(obs => obs.onStationTransition?.('semantic', incidentId))
    await sleep(delay)

    set({ status: 'searching', currentStage: 'knowledge_search', currentStation: 'knowledge_search' })
    observers.forEach(obs => obs.onStationTransition?.('knowledge_search', incidentId))
    const event2: IncidentEvent = {
      id: crypto.randomUUID(), type: 'knowledge_search_completed', incidentId,
      timestamp: formatTime(), stage: 'knowledge_search', station: 'knowledge_search',
      message: `[SIMULATION] pgvector match: KB-089 similarity 0.94 >= 0.85 (High Confidence)`,
    }
    set(state => ({ timeline: [...state.timeline, event2] }))
    await sleep(delay)

    // 5. Elena physically walks to David Chen (Backend Engineer) to assign
    observers.forEach(obs => obs.onStationTransition?.('routing', incidentId))
    set({ status: 'routing', currentStage: 'routing', currentStation: 'routing' })

    for (const obs of observers) {
      if (obs.onWalkCharacterToCharacter) {
        await obs.onWalkCharacterToCharacter('elena', 'david', 'David, take INC-1042. VPN authentication failure.')
      } else if (obs.onHumanWalk) {
        await obs.onHumanWalk('elena', 'developer_david', 'David, take INC-1042. VPN authentication failure.')
      }
    }
    observers.forEach(obs => {
      obs.onHumanBubble?.('elena', 'David, take INC-1042. VPN auth — run playbook.', 'assignment')
    })
    await sleep(delay + 200)

    // David acknowledges assignment
    observers.forEach(obs => obs.onHumanStateChange?.('david', 'alerted'))
    const event4: IncidentEvent = {
      id: crypto.randomUUID(), type: 'human_assigned', incidentId,
      actor: 'David Chen', timestamp: formatTime(), stage: 'remediation', station: 'developer_david',
      message: `[SIMULATION] Elena assigned David Chen: "INC-1042 VPN Auth failure." David acknowledged.`,
    }
    set(state => ({ timeline: [...state.timeline, event4] }))
    observers.forEach(obs => obs.onHumanBubble?.('david', 'Got it, Elena. On it now.', 'message'))
    await sleep(350)

    // Elena returns to her office
    for (const obs of observers) {
      if (obs.onHumanReturnHome) await obs.onHumanReturnHome('elena')
    }

    // 6. David walks to Playbook station
    set({ status: 'investigating', currentStage: 'remediation', currentStation: 'playbook' })
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('david', 'playbook', 'Applying VPN Auth playbook...')
    }
    observers.forEach(obs => obs.onStationTransition?.('playbook', incidentId))
    await sleep(delay + 200)

    // David investigates and applies fix
    observers.forEach(obs => {
      obs.onHumanStateChange?.('david', 'investigating')
      obs.onHumanBubble?.('david', 'Root cause identified: cert validation config. Fix applied!', 'investigation')
    })
    await sleep(delay + 300)

    // 7. David walks to QA (Maya Patel, QA Lead) for verification
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('david', 'qa_testing', 'Maya, can you validate this?')
    }
    observers.forEach(obs => {
      obs.onHumanBubble?.('david', 'Maya, can you validate the VPN fix?', 'handoff')
      obs.onHumanStateChange?.('maya', 'alerted')
    })
    await sleep(400)

    // Maya runs 5/5 health checks
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('maya', 'qa_testing', 'Running 5/5 health checks...')
    }
    set({ status: 'verifying', currentStage: 'verification', currentStation: 'verification', verificationStatus: 'verifying' })
    observers.forEach(obs => obs.onStationTransition?.('verification', incidentId))
    await sleep(delay + 200)

    set({ verificationStatus: 'passed' })
    observers.forEach(obs => obs.onHumanBubble?.('maya', '5/5 health checks passed! All green.', 'success'))
    const event5: IncidentEvent = {
      id: crypto.randomUUID(), type: 'verification_passed', incidentId,
      actor: 'Maya Patel', timestamp: formatTime(), stage: 'verification', station: 'qa_testing',
      message: `[SIMULATION] Maya Patel (QA Lead): 5/5 checks passed — ready to close.`,
    }
    set(state => ({ timeline: [...state.timeline, event5] }))
    await sleep(delay)

    // 8. David reports back to Elena
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('david', 'commander', 'Fix verified. Ready for signoff.')
    }
    observers.forEach(obs => obs.onHumanBubble?.('david', 'Verification complete. Ready to go live.', 'handoff'))
    await sleep(delay)

    // 9. Elena confirms: SITE LIVE!
    observers.forEach(obs => {
      obs.onHumanStateChange?.('elena', 'approved')
      obs.onHumanBubble?.('elena', 'Approved. SITE LIVE!', 'approval')
    })
    const event6: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_resolved', incidentId,
      actor: 'Elena Rodriguez', timestamp: formatTime(), stage: 'resolution', station: 'commander',
      message: `[SIMULATION] Elena Rodriguez: "SITE LIVE" — INC-1042 closed successfully.`,
    }
    set(state => ({
      timeline: [...state.timeline, event6],
      status: 'resolved',
      currentStage: 'resolution',
      currentStation: 'resolution',
      completedAt: formatTime(),
      isPlaying: false,
    }))
    observers.forEach(obs => obs.onStationTransition?.('resolution', incidentId))

    // Knowledge capture
    observers.forEach(obs => obs.onKnowledgeBubble?.())

    // All team members return home and client exits office
    await sleep(delay + 300)
    for (const obs of observers) {
      if (obs.onHumanReturnHome) {
        await obs.onHumanReturnHome('david')
        await obs.onHumanReturnHome('maya')
        await obs.onHumanReturnHome('elena')
      }
      if (obs.onClientExit) {
        await obs.onClientExit()
      }
    }
    observers.forEach(obs => {
      obs.onHumanStateChange?.('elena', 'idle')
    })
  },


  // ── 2. MID SCENARIO (0.78 Match — DB Pool Exhaustion, Human Decision Gate) ──────
  runMidScenario: async (onAwaitingDecision, override) => {
    const s = get()
    if (s.isPlaying) return

    get().reset()
    const client = override?.clientName
      ? { name: override.clientName, role: override.clientRole || 'External Customer' }
      : CLIENT_PERSONAS[clientRotationIndex++ % CLIENT_PERSONAS.length]

    const incidentId = override?.id || 'EPL-1067'
    const title = override?.title || 'Database Connection Pool Exhaustion on Checkout'
    const similarity = override?.similarity ?? 0.78
    const severity = override?.priority || 'P1'
    const now = formatTime()
    const delay = s.executionSpeedMs

    set({
      isPlaying: true,
      incidentId,
      title,
      severity,
      similarity,
      route: 'mid',
      assignedHuman: 'david',
      playbookId: override?.playbookId || 'DB-POOL-RESIZE',
      mode: 'SIMULATION',
      startedAt: now,
      status: 'received',
      currentStage: 'received',
      currentStation: 'intake',
      clientName: client.name,
      clientRole: client.role,
      activeLogSnippet: override?.logSnippet || 'TimeoutException: Connection acquisition timed out after 30000ms [active=30, idle=0, waiting=184].',
      activeMetrics: {
        latencyBefore: override?.latencyBefore || 3120,
        latencyAfter: override?.latencyAfter || 24,
        errorRateBefore: override?.errorRateBefore || 32.1,
        errorRateAfter: override?.errorRateAfter || 0.0,
        saturationBefore: override?.saturationBefore || 100,
        saturationAfter: override?.saturationAfter || 18,
      },
    })

    // 1. Client arrives at Reception
    for (const obs of observers) {
      if (obs.onClientArrive) await obs.onClientArrive(client.name, client.role)
    }
    const event0: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'client_reception',
      message: `[SIMULATION] Client ${client.name} arrived at Visitor Reception Hall`,
    }
    set(state => ({ timeline: [...state.timeline, event0] }))

    observers.forEach(obs => {
      obs.onHumanStateChange?.('client', 'waiting')
      obs.onHumanBubble?.('client', `${title}: checkout timeouts spike!`, 'alert')
    })
    await sleep(delay + 200)

    // 2. Elena meets Client in Reception
    observers.forEach(obs => obs.onHumanStateChange?.('elena', 'alerted'))
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('elena', 'reception_meet')
    }
    observers.forEach(obs => obs.onHumanStateChange?.('elena', 'talking'))

    // 3. Client hands envelope to Elena
    for (const obs of observers) {
      if (obs.onClientMail) await obs.onClientMail()
    }
    const event1: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'intake',
      message: `[SIMULATION] Client reported ${incidentId}: ${title}`,
    }
    set(state => ({ timeline: [...state.timeline, event1] }))

    observers.forEach(obs => {
      obs.onMailNotification?.(title, incidentId, severity)
      obs.onHumanBubble?.('elena', `${severity} issue reported. Reviewing classification...`, 'status')
    })
    await sleep(delay + 300)

    // Elena classification evaluation
    const eventEval: IncidentEvent = {
      id: crypto.randomUUID(), type: 'routing_decision', incidentId,
      timestamp: formatTime(), stage: 'routing', station: 'routing',
      message: `[SIMULATION] Elena evaluated classification: Incident Type = Database & Backend Pool Exhaustion. Assigning David Chen.`,
    }
    set(state => ({ timeline: [...state.timeline, eventEval] }))

    observers.forEach(obs => {
      obs.onRouteSelected?.('mid')
      obs.onStationTransition?.('intake', incidentId)
    })
    await sleep(delay)

    observers.forEach(obs => obs.onStationTransition?.('semantic', incidentId))
    await sleep(delay)

    observers.forEach(obs => obs.onStationTransition?.('knowledge_search', incidentId))
    const event2: IncidentEvent = {
      id: crypto.randomUUID(), type: 'knowledge_search_completed', incidentId,
      timestamp: formatTime(), stage: 'knowledge_search', station: 'knowledge_search',
      message: `[SIMULATION] pgvector search: similarity 0.72 (Human decision required)`,
    }
    set(state => ({ timeline: [...state.timeline, event2] }))
    await sleep(delay)

    // 4. Elena physically walks to David Chen
    observers.forEach(obs => obs.onStationTransition?.('routing', incidentId))
    set({ status: 'routing', currentStage: 'routing', currentStation: 'routing' })

    for (const obs of observers) {
      if (obs.onWalkCharacterToCharacter) {
        await obs.onWalkCharacterToCharacter('elena', 'david', 'David, checkout DB pool is exhausted. Review suggested fix.')
      } else if (obs.onHumanWalk) {
        await obs.onHumanWalk('elena', 'developer_david', 'David, checkout DB pool is exhausted. Review suggested fix.')
      }
    }
    observers.forEach(obs => {
      obs.onHumanBubble?.('elena', 'David, checkout DB pool is exhausted. Review fix.', 'assignment')
    })
    await sleep(delay + 200)

    observers.forEach(obs => obs.onHumanStateChange?.('david', 'alerted'))
    const event3: IncidentEvent = {
      id: crypto.randomUUID(), type: 'human_assigned', incidentId,
      actor: 'David Chen', timestamp: formatTime(), stage: 'remediation', station: 'developer_david',
      message: `[SIMULATION] Elena assigned David Chen: "Review connection pool expansion". David acknowledged.`,
    }
    set(state => ({ timeline: [...state.timeline, event3] }))
    observers.forEach(obs => obs.onHumanBubble?.('david', 'Analyzing connection pool metrics now.', 'message'))
    await sleep(350)

    // Elena returns to her office
    for (const obs of observers) {
      if (obs.onHumanReturnHome) await obs.onHumanReturnHome('elena')
    }

    // 5. David walks to Routing / Investigation Core
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('david', 'routing', 'Reviewing connection pool fix')
    }
    set({ status: 'awaiting_human', currentStage: 'remediation', currentStation: 'routing' })

    // Open human decision interface
    onAwaitingDecision?.()
  },

  approveHumanFix: async () => {
    const s = get()
    const incidentId = s.incidentId || 'EPL-1067'
    const delay = s.executionSpeedMs

    observers.forEach((obs) => obs.onHumanBubble?.('david', 'Fix Approved! Scaling pool to 150.', 'investigation'))
    const event1: IncidentEvent = {
      id: crypto.randomUUID(), type: 'human_accepted', incidentId,
      actor: 'David Chen', timestamp: formatTime(), stage: 'remediation', station: 'routing',
      message: `[SIMULATION] David Chen: Approved Fix — DB pool capacity scaled to 150 connections.`,
    }
    set((state) => ({ timeline: [...state.timeline, event1], status: 'executing' }))
    await sleep(delay)

    // David walks to QA -> Noah verifies latency
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('david', 'qa_testing', 'Testing connection pool fix')
    }
    observers.forEach((obs) => obs.onHumanStateChange?.('noah', 'alerted'))
    await sleep(300)

    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('noah', 'qa_testing', 'Running regression tests')
    }
    set({ status: 'verifying', currentStage: 'verification', currentStation: 'verification', verificationStatus: 'verifying' })
    observers.forEach((obs) => obs.onStationTransition?.('verification', incidentId))
    await sleep(delay + 200)

    set({ verificationStatus: 'passed' })
    observers.forEach((obs) => obs.onHumanBubble?.('noah', 'QA Passed: Latency < 45ms, 0 errors.', 'success'))
    await sleep(delay)

    // David reports to Elena
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('david', 'commander', 'Pool scaled. QA passed. Site Live.')
    }
    await sleep(delay)

    observers.forEach((obs) => obs.onHumanBubble?.('elena', 'Approved. SITE LIVE!', 'approval'))
    const event2: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_resolved', incidentId,
      actor: 'Elena Rodriguez', timestamp: formatTime(), stage: 'resolution', station: 'commander',
      message: `[SIMULATION] Incident ${incidentId} resolved with Developer & QA signoff.`,
    }
    set((state) => ({
      timeline: [...state.timeline, event2],
      status: 'resolved',
      currentStage: 'resolution',
      currentStation: 'resolution',
      completedAt: formatTime(),
      isPlaying: false,
    }))
    observers.forEach((obs) => obs.onStationTransition?.('resolution', incidentId))

    // Knowledge capture
    observers.forEach((obs) => obs.onKnowledgeBubble?.())

    await sleep(delay + 200)
    for (const obs of observers) {
      if (obs.onHumanReturnHome) {
        await obs.onHumanReturnHome('david')
        await obs.onHumanReturnHome('noah')
        await obs.onHumanReturnHome('elena')
      }
      if (obs.onClientExit) {
        await obs.onClientExit()
      }
    }
    observers.forEach((obs) => {
      obs.onHumanStateChange?.('elena', 'idle')
    })
  },

  // ── 3. UNKNOWN SCENARIO (0.41 Match — Multi-Person SRE & Dev Collaboration) ──────
  runUnknownScenario: async (onAwaitingApproval, override) => {
    const s = get()
    if (s.isPlaying) return

    get().reset()
    const client = override?.clientName
      ? { name: override.clientName, role: override.clientRole || 'External Customer' }
      : CLIENT_PERSONAS[clientRotationIndex++ % CLIENT_PERSONAS.length]

    const incidentId = override?.id || 'EPL-1088'
    const title = override?.title || 'Cross-Cluster Distributed Lock Deadlock'
    const similarity = override?.similarity ?? 0.41
    const severity = override?.priority || 'P1'
    const now = formatTime()
    const delay = s.executionSpeedMs

    set({
      isPlaying: true,
      incidentId,
      title,
      severity,
      similarity,
      route: 'unknown',
      assignedHuman: 'marcus',
      playbookId: override?.playbookId || 'DEADLOCK-BREAK-TX',
      mode: 'SIMULATION',
      startedAt: now,
      status: 'received',
      currentStage: 'received',
      currentStation: 'intake',
      clientName: client.name,
      clientRole: client.role,
      activeLogSnippet: override?.logSnippet || 'DeadlockDetected: Transaction 8412 waiting on ShareLock for relation inventory held by 8419.',
      activeMetrics: {
        latencyBefore: override?.latencyBefore || 8540,
        latencyAfter: override?.latencyAfter || 42,
        errorRateBefore: override?.errorRateBefore || 45.6,
        errorRateAfter: override?.errorRateAfter || 0.01,
        saturationBefore: override?.saturationBefore || 98,
        saturationAfter: override?.saturationAfter || 22,
      },
    })

    // 1. Client arrives at Reception
    for (const obs of observers) {
      if (obs.onClientArrive) await obs.onClientArrive(client.name, client.role)
    }
    const event0: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'client_reception',
      message: `[SIMULATION] Client ${client.name} arrived at Visitor Reception Hall`,
    }
    set(state => ({ timeline: [...state.timeline, event0] }))

    observers.forEach(obs => {
      obs.onHumanStateChange?.('client', 'waiting')
      obs.onHumanBubble?.('client', `${title}: CRITICAL transactions deadlocked!`, 'alert')
    })
    await sleep(delay + 200)

    // 2. Elena meets Client in Reception
    observers.forEach(obs => obs.onHumanStateChange?.('elena', 'alerted'))
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('elena', 'reception_meet')
    }
    observers.forEach(obs => obs.onHumanStateChange?.('elena', 'talking'))

    // 3. Client hands over envelope to Elena
    for (const obs of observers) {
      if (obs.onClientMail) await obs.onClientMail()
    }
    const event1: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'intake',
      message: `[SIMULATION] Client ${severity} Webhook: ${incidentId} — ${title}`,
    }
    set(state => ({ timeline: [...state.timeline, event1] }))

    observers.forEach(obs => {
      obs.onMailNotification?.(title, incidentId, severity)
      obs.onHumanBubble?.('elena', `${severity} incident reported. Checking vector database...`, 'status')
    })
    await sleep(delay + 300)

    // Elena classification evaluation: Critical Infra / Payments
    const eventEval: IncidentEvent = {
      id: crypto.randomUUID(), type: 'routing_decision', incidentId,
      timestamp: formatTime(), stage: 'routing', station: 'routing',
      message: `[SIMULATION] Elena evaluated classification: Novel P1 Infrastructure & Payments Deadlock. Assigning Marcus (DevOps/SRE).`,
    }
    set(state => ({ timeline: [...state.timeline, eventEval] }))

    observers.forEach(obs => {
      obs.onRouteSelected?.('unknown')
      obs.onStationTransition?.('intake', incidentId)
    })
    await sleep(delay)

    observers.forEach(obs => obs.onStationTransition?.('semantic', incidentId))
    await sleep(delay)

    observers.forEach(obs => obs.onStationTransition?.('knowledge_search', incidentId))
    const event2: IncidentEvent = {
      id: crypto.randomUUID(), type: 'knowledge_search_completed', incidentId,
      timestamp: formatTime(), stage: 'knowledge_search', station: 'knowledge_search',
      message: `[SIMULATION] pgvector: Similarity 0.41 (< 0.55). NOVEL INCIDENT. Full AI Diagnostics required.`,
    }
    set(state => ({ timeline: [...state.timeline, event2] }))
    await sleep(delay)

    // 4. Elena physically walks to Marcus (DevOps / SRE)
    observers.forEach(obs => obs.onStationTransition?.('routing', incidentId))

    for (const obs of observers) {
      if (obs.onWalkCharacterToCharacter) {
        await obs.onWalkCharacterToCharacter('elena', 'marcus', 'Marcus, critical novel deadlock. Initiate AI diagnostics.')
      } else if (obs.onHumanWalk) {
        await obs.onHumanWalk('elena', 'devops_marcus', 'Marcus, critical novel deadlock. Initiate AI diagnostics.')
      }
    }
    observers.forEach(obs => {
      obs.onHumanBubble?.('elena', 'Marcus: Novel P1 deadlock across clusters. Initiate AI Diagnostics.', 'assignment')
    })
    await sleep(delay + 200)

    // Marcus alerted
    observers.forEach(obs => obs.onHumanStateChange?.('marcus', 'alerted'))
    observers.forEach(obs => obs.onHumanBubble?.('marcus', 'On it. Activating telemetry & AI stack diagnostics.', 'message'))
    await sleep(350)

    // Server racks LEDs pulse rapidly with high alert
    observers.forEach(obs => obs.onDevOpsHighActivity?.(true))

    // Elena returns to her office
    for (const obs of observers) {
      if (obs.onHumanReturnHome) await obs.onHumanReturnHome('elena')
    }

    // 5. Marcus walks to AI Diagnostics
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('marcus', 'ai_diagnostics', 'Novel deadlock: parsing lock traces')
    }
    set({ status: 'investigating', currentStage: 'remediation', currentStation: 'ai_diagnostics' })
    observers.forEach(obs => obs.onStationTransition?.('ai_diagnostics', incidentId))
    await sleep(delay)

    // 6. Arjun Mehta (Payments Engineer) joins Marcus to collaborate!
    observers.forEach(obs => obs.onHumanStateChange?.('arjun', 'alerted'))
    await sleep(250)

    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('arjun', 'ai_diagnostics', 'Collaborating on lock order fix')
    }
    observers.forEach(obs => {
      obs.onHumanBubble?.('marcus', 'Circular wait between orders & inventory', 'investigation')
      obs.onHumanBubble?.('arjun', 'Enforcing deterministic lock sorting', 'investigation')
    })
    await sleep(delay + 400)

    // 7. Noah Williams (QA) stress validates
    observers.forEach(obs => obs.onHumanStateChange?.('noah', 'alerted'))
    await sleep(250)

    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('noah', 'qa_testing', 'Simulating 10k concurrent transactions')
    }
    set({ status: 'verifying', currentStage: 'verification', currentStation: 'verification', verificationStatus: 'verifying' })
    observers.forEach(obs => obs.onStationTransition?.('verification', incidentId))
    await sleep(delay + 200)

    set({ verificationStatus: 'passed' })
    observers.forEach(obs => obs.onHumanBubble?.('noah', '0 deadlocks across 10,000 transactions!', 'success'))
    await sleep(delay)

    // 8. Marcus & Arjun walk to Elena (Command Suite) for signoff
    for (const obs of observers) {
      if (obs.onHumanWalk) {
        await obs.onHumanWalk('marcus', 'commander', 'Deadlock hotpatch validated.')
        await obs.onHumanWalk('arjun', 'commander', 'Requesting site deployment.')
      }
    }
    set({ status: 'awaiting_human', currentStation: 'commander' })

    onAwaitingApproval?.()
  },

  approveElenaSignoff: async () => {
    const s = get()
    const incidentId = s.incidentId || 'EPL-1088'
    const delay = s.executionSpeedMs

    observers.forEach((obs) => obs.onHumanBubble?.('elena', 'Hotpatch approved. SITE LIVE!', 'approval'))
    const event1: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_resolved', incidentId,
      actor: 'Elena Rodriguez', timestamp: formatTime(), stage: 'resolution', station: 'commander',
      message: `[SIMULATION] Elena Rodriguez: "SITE LIVE" — Multi-team incident resolved.`,
    }
    set((state) => ({
      timeline: [...state.timeline, event1],
      status: 'resolved',
      currentStage: 'resolution',
      currentStation: 'resolution',
      completedAt: formatTime(),
      isPlaying: false,
    }))
    observers.forEach((obs) => {
      obs.onStationTransition?.('resolution', incidentId)
      obs.onDevOpsHighActivity?.(false)
    })

    // Knowledge capture
    set({
      knowledgeCandidate: {
        id: 'KB-1250',
        title: 'Deterministic Lock Ordering Remediation',
        resolution: 'Enforce sorted primary key locking prior to inventory mutations',
        similarityBefore: 0.41,
        similarityAfter: 0.94,
      }
    })
    observers.forEach((obs) => obs.onKnowledgeBubble?.())

    // All humans return home and client exits office
    await sleep(delay + 200)
    for (const obs of observers) {
      if (obs.onHumanReturnHome) {
        await obs.onHumanReturnHome('marcus')
        await obs.onHumanReturnHome('arjun')
        await obs.onHumanReturnHome('noah')
        await obs.onHumanReturnHome('elena')
      }
      if (obs.onClientExit) {
        await obs.onClientExit()
      }
    }
    observers.forEach((obs) => {
      obs.onHumanStateChange?.('elena', 'idle')
    })
  },

  // ── 4. REPLAY CLOSED LOOP (Demonstrating Learning: 0.41 -> 0.94) ────────────
  runReplayScenario: async () => {
    const s = get()
    if (s.isPlaying) return

    get().reset()
    const incidentId = 'EPL-1088 (REPLAY)'
    const now = formatTime()
    const delay = s.executionSpeedMs

    set({
      isPlaying: true,
      replayBanner: 'CLOSED-LOOP REPLAY: Incident learned from team fix. Recurring issue now matches at 0.94 similarity!',
      incidentId,
      title: 'Deterministic Lock Ordering (Learned Pattern)',
      severity: 'P1',
      similarity: 0.94,
      route: 'known',
      playbookId: 'KB-1250',
      mode: 'SIMULATION',
      startedAt: now,
      status: 'received',
      currentStage: 'received',
      currentStation: 'intake',
    })

    const event1: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'intake',
      message: `[SIMULATION] Re-ingesting recurring incident: ${incidentId}`,
    }
    set((state) => ({ timeline: [...state.timeline, event1] }))
    observers.forEach((obs) => {
      obs.onHumanStateChange?.('elena', 'alerted')
      obs.onRouteSelected?.('known')
      obs.onStationTransition?.('intake', incidentId)
    })
    await sleep(delay)

    observers.forEach((obs) => obs.onStationTransition?.('semantic', incidentId))
    await sleep(delay)

    observers.forEach((obs) => obs.onStationTransition?.('knowledge_search', incidentId))
    const event2: IncidentEvent = {
      id: crypto.randomUUID(), type: 'knowledge_search_completed', incidentId,
      timestamp: formatTime(), stage: 'knowledge_search', station: 'knowledge_search',
      message: `[SIMULATION] pgvector MATCH: KB-1250 similarity 0.94! Learned from previous human fix!`,
    }
    set((state) => ({ timeline: [...state.timeline, event2] }))
    await sleep(delay)

    observers.forEach((obs) => obs.onStationTransition?.('routing', incidentId))
    await sleep(delay)

    // Autonomous Playbook execution
    observers.forEach((obs) => obs.onStationTransition?.('playbook', incidentId))
    set({ status: 'executing', currentStage: 'remediation', currentStation: 'playbook' })
    await sleep(delay)

    // Verification
    observers.forEach((obs) => obs.onStationTransition?.('verification', incidentId))
    set({ status: 'verifying', currentStage: 'verification', currentStation: 'verification', verificationStatus: 'passed' })
    await sleep(delay)

    // Resolution
    const finishedAt = formatTime()
    set({ status: 'resolved', currentStage: 'resolution', currentStation: 'resolution', completedAt: finishedAt })
    observers.forEach((obs) => obs.onStationTransition?.('resolution', incidentId))
    const event3: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_resolved', incidentId,
      timestamp: finishedAt, stage: 'resolution', station: 'resolution',
      message: `[SIMULATION] 🎉 CLOSED-LOOP SUCCESS: Incident resolved 100% autonomously in 1.88s with 0 human intervention!`,
    }
    set((state) => ({ timeline: [...state.timeline, event3], isPlaying: false }))

    observers.forEach((obs) => obs.onHumanStateChange?.('elena', 'idle'))
  },

  // ── 5. GRACEFUL FAILURE SCENARIO (Insufficient Evidence — Human Review Required) ──
  runFailureScenario: async (override) => {
    const s = get()
    if (s.isPlaying) return

    get().reset()
    const client = override?.clientName
      ? { name: override.clientName, role: override.clientRole || 'External Customer' }
      : CLIENT_PERSONAS[clientRotationIndex++ % CLIENT_PERSONAS.length]

    const incidentId = override?.id || 'EPL-1099'
    const title = override?.title || 'Cryptographic Signature Verification Anomaly'
    const similarity = override?.similarity ?? 0.28
    const severity = override?.priority || 'P1'
    const now = formatTime()
    const delay = s.executionSpeedMs

    set({
      isPlaying: true,
      incidentId,
      title,
      severity,
      similarity,
      route: 'unknown',
      assignedHuman: 'elena',
      mode: 'SIMULATION',
      startedAt: now,
      status: 'received',
      currentStage: 'received',
      currentStation: 'intake',
      clientName: client.name,
      clientRole: client.role,
      activeLogSnippet: override?.logSnippet || 'CryptoSignatureVerificationFailed: Algorithm curve secp256k1 digest mismatch on payload block 94.',
      activeMetrics: {
        latencyBefore: override?.latencyBefore || 2400,
        latencyAfter: override?.latencyAfter || 18,
        errorRateBefore: override?.errorRateBefore || 100.0,
        errorRateAfter: override?.errorRateAfter || 0.0,
        saturationBefore: override?.saturationBefore || 88,
        saturationAfter: override?.saturationAfter || 12,
      },
    })

    // Client arrives
    for (const obs of observers) {
      if (obs.onClientArrive) await obs.onClientArrive(client.name, client.role)
    }
    const event0: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'client_reception',
      message: `[SIMULATION] Client ${client.name} arrived at Visitor Reception Hall`,
    }
    set(state => ({ timeline: [...state.timeline, event0] }))

    observers.forEach(obs => {
      obs.onHumanStateChange?.('client', 'waiting')
      obs.onHumanBubble?.('client', `${title}: edge ingress failing!`, 'alert')
    })
    await sleep(delay + 200)

    // Elena meets client
    observers.forEach(obs => obs.onHumanStateChange?.('elena', 'alerted'))
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('elena', 'reception_meet')
    }

    for (const obs of observers) {
      if (obs.onClientMail) await obs.onClientMail()
    }
    const event1: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_received', incidentId,
      timestamp: formatTime(), stage: 'received', station: 'intake',
      message: `[SIMULATION] ${incidentId}: Cascading service degradation — unknown pattern`,
    }
    set(state => ({ timeline: [...state.timeline, event1] }))
    observers.forEach(obs => {
      obs.onMailNotification?.('Cascading Service Degradation', incidentId, 'P1')
      obs.onHumanBubble?.('elena', 'Unusual pattern — processing...', 'status')
    })
    await sleep(delay + 300)

    // AI Processing: intake → semantic → knowledge search → INSUFFICIENT
    observers.forEach(obs => obs.onRouteSelected?.('unknown'))
    observers.forEach(obs => obs.onStationTransition?.('intake', incidentId))
    await sleep(delay)

    set({ status: 'normalizing', currentStage: 'normalized', currentStation: 'semantic' })
    observers.forEach(obs => obs.onStationTransition?.('semantic', incidentId))
    await sleep(delay)

    set({ status: 'searching', currentStage: 'knowledge_search', currentStation: 'knowledge_search' })
    observers.forEach(obs => obs.onStationTransition?.('knowledge_search', incidentId))
    const event2: IncidentEvent = {
      id: crypto.randomUUID(), type: 'knowledge_search_completed', incidentId,
      timestamp: formatTime(), stage: 'knowledge_search', station: 'knowledge_search',
      message: `[SIMULATION] pgvector: Similarity 0.28 — INSUFFICIENT EVIDENCE. No prior pattern found.`,
    }
    set(state => ({ timeline: [...state.timeline, event2] }))
    await sleep(delay)

    observers.forEach(obs => obs.onStationTransition?.('routing', incidentId))
    set({ status: 'routing', currentStage: 'routing', currentStation: 'routing' })
    await sleep(delay)

    // AI cannot safely resolve — graceful failure
    const eventFail: IncidentEvent = {
      id: crypto.randomUUID(), type: 'routing_decision', incidentId,
      timestamp: formatTime(), stage: 'routing', station: 'routing',
      message: `[SIMULATION] INSUFFICIENT EVIDENCE (0.28 < 0.55). AI cannot safely auto-resolve. Escalating to human review.`,
    }
    set(state => ({ timeline: [...state.timeline, eventFail] }))
    observers.forEach(obs => {
      obs.onHumanBubble?.('elena', 'Insufficient evidence. Human review required.', 'alert')
    })
    await sleep(delay + 200)

    // Elena walks to AI Diagnostics with Marcus for deep investigation
    for (const obs of observers) {
      if (obs.onWalkCharacterToCharacter) {
        await obs.onWalkCharacterToCharacter('elena', 'marcus', 'Marcus — novel cascading failure. Full SRE review.')
      } else if (obs.onHumanWalk) {
        await obs.onHumanWalk('elena', 'devops_marcus', 'Marcus — novel cascading failure. Full SRE review.')
      }
    }
    observers.forEach(obs => obs.onHumanStateChange?.('marcus', 'alerted'))
    observers.forEach(obs => obs.onDevOpsHighActivity?.(true))
    await sleep(delay + 300)

    for (const obs of observers) {
      if (obs.onHumanReturnHome) await obs.onHumanReturnHome('elena')
    }

    // Marcus investigates at AI Diagnostics
    for (const obs of observers) {
      if (obs.onHumanWalk) await obs.onHumanWalk('marcus', 'ai_diagnostics', 'Deep forensics: multi-service cascade')
    }
    set({ status: 'investigating', currentStage: 'remediation', currentStation: 'ai_diagnostics' })
    observers.forEach(obs => obs.onStationTransition?.('ai_diagnostics', incidentId))
    observers.forEach(obs => obs.onHumanBubble?.('marcus', 'Running full stack forensics...', 'investigation'))
    await sleep(delay + 400)

    // Manual resolution — Elena approves after human review
    observers.forEach(obs => {
      obs.onHumanStateChange?.('elena', 'approved')
      obs.onHumanBubble?.('elena', 'Human review complete. Safe to proceed.', 'approval')
    })
    const event3: IncidentEvent = {
      id: crypto.randomUUID(), type: 'incident_resolved', incidentId,
      timestamp: formatTime(), stage: 'resolution', station: 'commander',
      message: `[SIMULATION] Graceful Resolution: INC-1099 resolved via mandatory human review (insufficient AI confidence).`,
    }
    set(state => ({
      timeline: [...state.timeline, event3],
      status: 'resolved',
      currentStage: 'resolution',
      currentStation: 'resolution',
      completedAt: formatTime(),
      isPlaying: false,
    }))
    observers.forEach(obs => {
      obs.onStationTransition?.('resolution', incidentId)
      obs.onDevOpsHighActivity?.(false)
    })

    // Knowledge capture
    observers.forEach(obs => obs.onKnowledgeBubble?.())

    await sleep(delay + 300)
    for (const obs of observers) {
      if (obs.onHumanReturnHome) {
        await obs.onHumanReturnHome('marcus')
        await obs.onHumanReturnHome('elena')
      }
      if (obs.onClientExit) {
        await obs.onClientExit()
      }
    }
    observers.forEach(obs => {
      obs.onHumanStateChange?.('elena', 'idle')
    })
  },

  // ── 6. DISPATCH RANDOM CORRECTIVE MAINTENANCE SCENARIO ──────────────────────
  runRandomCorrectiveScenario: async (onAwaitingDecision, onAwaitingApproval) => {
    const inc = CORRECTIVE_MAINTENANCE_POOL[incidentRotationIndex++ % CORRECTIVE_MAINTENANCE_POOL.length]
    const client = CLIENT_PERSONAS[clientRotationIndex++ % CLIENT_PERSONAS.length]
    const override = { ...inc, clientName: client.name, clientRole: client.role }

    if (inc.route === 'known') {
      await get().runKnownScenario(override)
    } else if (inc.route === 'mid') {
      await get().runMidScenario(onAwaitingDecision, override)
    } else if (inc.similarity < 0.35) {
      await get().runFailureScenario(override)
    } else {
      await get().runUnknownScenario(onAwaitingApproval, override)
    }
  },
}))

