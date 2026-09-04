import { AppShell } from '@/components/layout/AppShell'

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h1 className="text-lg font-bold">Settings & Integrations</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Connected systems: n8n, Supabase, OpenAI, Jira
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3 max-w-xl">
            {[
              { name: 'n8n Workflow Engine', status: 'connected', detail: 'Orchestration and playbook execution' },
              { name: 'Supabase / PostgreSQL', status: 'connected', detail: 'Incident storage and realtime events' },
              { name: 'pgvector', status: 'connected', detail: 'Knowledge base vector similarity search' },
              { name: 'OpenAI Embeddings', status: 'connected', detail: 'text-embedding-3-large (1536 dimensions)' },
              { name: 'Jira', status: 'connected', detail: 'Ticket tracking and status synchronization' },
            ].map(item => (
              <div
                key={item.name}
                className="panel p-4 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold">{item.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.detail}</div>
                </div>
                <span
                  className="text-[9px] font-bold px-2 py-1 rounded"
                  style={{ background: 'var(--color-known-bg)', border: '1px solid var(--color-known-border)', color: 'var(--color-known)' }}
                >
                  ● CONNECTED
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
