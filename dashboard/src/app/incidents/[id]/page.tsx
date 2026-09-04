'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useQuery } from '@tanstack/react-query'
import { fetchIncidentById, fetchWorkflowEvents } from '@/lib/api'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: incident, isLoading } = useQuery({ queryKey: ['incident', id], queryFn: () => fetchIncidentById(id) })
  const { data: events = [] } = useQuery({ queryKey: ['workflow-events', id], queryFn: () => fetchWorkflowEvents(id) })

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <Link href="/incidents" className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={12} /> Incidents
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-processing)' }}>{id}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : !incident ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Incident not found.</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {/* Main details */}
              <div className="col-span-2 flex flex-col gap-4">
                <div className="panel p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-processing)' }}>{incident.id}</div>
                      <h1 className="text-lg font-bold mt-1">{incident.title}</h1>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{incident.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {incident.route && <span className={`route-badge ${incident.route}`}>{incident.route.toUpperCase()}</span>}
                      {incident.similarity && (
                        <span className="font-mono text-lg font-black" style={{ color: incident.route === 'known' ? 'var(--color-known)' : incident.route === 'mid' ? 'var(--color-mid)' : 'var(--color-unknown)' }}>
                          {incident.similarity.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Priority', value: incident.priority },
                      { label: 'Source', value: incident.source },
                      { label: 'Service', value: incident.service },
                      { label: 'Environment', value: incident.environment },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                        <div className="text-sm font-medium">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {incident.jiraKey && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <a
                        href={incident.jiraUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: 'var(--color-processing)' }}
                      >
                        <ExternalLink size={11} /> Jira: {incident.jiraKey}
                      </a>
                    </div>
                  )}
                </div>

                {/* Suggested Resolution */}
                {incident.suggestedResolution && (
                  <div className="panel p-4">
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Suggested Resolution</div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{incident.suggestedResolution}</p>
                  </div>
                )}

                {/* Workflow Timeline */}
                <div className="panel p-4">
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Workflow Timeline</div>
                  {events.length === 0 ? (
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No workflow events recorded.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {events.map(event => (
                        <div key={event.id} className="flex gap-3 items-start">
                          <div className="text-[9px] font-mono w-20 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {new Date(event.createdAt).toLocaleTimeString()}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold font-mono" style={{ color: 'var(--color-processing)' }}>{event.eventType}</div>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{event.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="flex flex-col gap-3">
                <div className="panel p-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Status</div>
                  <div className="text-sm font-bold uppercase">{incident.status}</div>
                  {incident.mttr && (
                    <div className="mt-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      MTTR: <span className="font-mono font-bold">{incident.mttr}m</span>
                    </div>
                  )}
                </div>

                <div className="panel p-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Timestamps</div>
                  <div className="flex flex-col gap-1 text-[10px]">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Created</span>
                      <span className="font-mono">{new Date(incident.createdAt).toLocaleString()}</span>
                    </div>
                    {incident.resolvedAt && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Resolved</span>
                        <span className="font-mono" style={{ color: 'var(--color-known)' }}>{new Date(incident.resolvedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
