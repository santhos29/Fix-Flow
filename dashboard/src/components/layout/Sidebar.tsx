'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  AlertTriangle,
  BookOpen,
  Cpu,
  ShieldAlert,
  BarChart3,
  Zap,
  Settings,
} from 'lucide-react'
import { useIncidentSimulationEngine } from '@/store/incident-simulation-engine'

const NAV_ITEMS = [
  { href: '/operations', label: 'Operations', icon: LayoutDashboard },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { href: '/playbooks', label: 'Playbooks', icon: Zap },
  { href: '/automation', label: 'Automation', icon: Cpu },
  { href: '/reliability', label: 'Reliability', icon: ShieldAlert },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const sim = useIncidentSimulationEngine()

  const hasActiveIncident = Boolean(sim.incidentId)
  const incidentId = sim.incidentId
  const title = sim.title || 'System Standby'
  const stage = sim.currentStage || 'Idle'
  const similarity = sim.similarity !== null ? sim.similarity.toFixed(2) : '--'
  const route = sim.route || 'STANDBY'

  return (
    <aside className="app-sidebar select-none" aria-label="Main Navigation">
      {/* ── Navigation Links ── */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto" role="navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/operations' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="flex-1 truncate text-xs">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Active Incident Card & Manager Profile ── */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex flex-col gap-3">
        {/* Active Incident or Standby Card */}
        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
          hasActiveIncident
            ? 'bg-purple-950/40 border-purple-500/40'
            : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className={`font-bold tracking-wider ${
              hasActiveIncident ? 'text-purple-300' : 'text-slate-400'
            }`}>
              {hasActiveIncident ? 'ACTIVE INCIDENT' : 'STANDBY'}
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                hasActiveIncident ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400'
              }`} />
              <span className={hasActiveIncident ? 'text-purple-300 font-bold' : 'text-slate-500'}>
                {hasActiveIncident ? incidentId : 'READY'}
              </span>
            </span>
          </div>

          <div className="text-[11px] font-bold text-white leading-tight truncate mt-0.5">
            {title}
          </div>

          {hasActiveIncident ? (
            <>
              <div className="grid grid-cols-2 gap-1 pt-1.5 mt-1 border-t border-slate-800 text-[8px] font-mono">
                <div>
                  <span className="text-slate-500 uppercase block">STAGE</span>
                  <span className="text-slate-300 font-bold uppercase">{stage}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">SIMILARITY</span>
                  <span className="text-green-400 font-bold">{similarity}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 uppercase block">ROUTE</span>
                  <span className="text-green-400 font-bold uppercase">{route}</span>
                </div>
              </div>

              <Link
                href={`/incidents/${incidentId}`}
                className="mt-1.5 w-full py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-[9px] font-bold text-center block transition-all"
              >
                Inspect Incident
              </Link>
            </>
          ) : (
            <div className="pt-1 mt-1 border-t border-slate-800 text-[9px] text-slate-500 font-mono">
              Ready
            </div>
          )}
        </div>

        {/* Manager Elena Profile */}
        <div className="flex items-center gap-2.5 pt-1">
          <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center overflow-hidden">
            <Image src="/assets/humans/Coworking-amico.svg" alt="Elena" width={28} height={28} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">Elena Rodriguez</div>
            <div className="text-[9px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Incident Manager</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
