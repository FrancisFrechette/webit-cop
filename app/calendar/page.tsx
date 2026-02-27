'use client';

import DashboardShell from '@/app/(dashboard)/DashboardShell';

export default function CalendarPage() {
  return (
    <DashboardShell>
      <div className="layout-container py-8">
        <h1 className="text-3xl font-semibold text-white">Calendrier</h1>
        <p className="mt-4 text-webit-fg-muted">À venir.</p>
      </div>
    </DashboardShell>
  );
}
