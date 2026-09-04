import { AppShell } from '@/components/layout/AppShell'

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h1 className="text-lg font-bold">Analytics</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Incident trends, automation efficiency, and knowledge growth
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3" aria-hidden="true">📊</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Analytics dashboard coming soon</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>See Reliability Center for live metrics</div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
