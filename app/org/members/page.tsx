'use client';

import DashboardShell from '@/app/_components/DashboardShell';
import { useCallback, useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/http';
import type { OrgMember, OrgRole } from '@/lib/domain';

const ORG_ROLES: OrgRole[] = ['owner', 'admin', 'editor', 'author', 'viewer'];

function OrgMembersInner() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<OrgRole>('editor');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orgs/current/members', {
        headers: { ...headers },
        credentials: 'include',
      });
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Vous n’avez pas les droits pour gérer les membres.');
        setMembers([]);
        return;
      }
      if (!res.ok) {
        setError('Erreur au chargement des membres.');
        setMembers([]);
        return;
      }
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch {
      setError('Erreur au chargement des membres.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = addEmail.trim().toLowerCase();
    if (!email) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orgs/current/members', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userEmail: email, role: addRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'Erreur lors de l’ajout.');
        return;
      }
      setAddEmail('');
      setAddRole('editor');
      setMessage('Membre ajouté.');
      fetchMembers();
    } catch {
      setMessage('Erreur lors de l’ajout.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: OrgRole) => {
    const m = members.find((x) => x.userId === userId);
    if (!m) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orgs/current/members', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userEmail: m.userEmail,
          role: newRole,
          userId: m.userId,
          userDisplayName: m.userDisplayName,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? 'Erreur lors du changement de rôle.');
        return;
      }
      setMessage(null);
      fetchMembers();
    } catch {
      setMessage('Erreur lors du changement de rôle.');
    }
  };

  const handleRemove = async (m: OrgMember) => {
    if (!confirm('Retirer ce membre de l’organisation ?')) return;
    const id = m.userId || m.userEmail;
    if (!id) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/orgs/current/members/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...headers },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'Erreur lors de la suppression.');
        return;
      }
      setMessage(null);
      fetchMembers();
    } catch {
      setMessage('Erreur lors de la suppression.');
    }
  };

  if (loading) {
    return (
      <div className="layout-container py-12">
        <p className="text-webit-fg-muted">Chargement des membres…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="layout-container py-12">
        <p className="text-webit-fg-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="layout-container py-12">
      <h1 className="text-2xl font-semibold text-white">Membres de l’organisation</h1>
      <p className="mt-1 text-sm text-webit-fg-muted">
        Owner est le rôle le plus élevé. Ne retirez pas le dernier owner.
      </p>

      {message && (
        <div className="mt-4 rounded border border-webit-panel-border bg-slate-800/60 px-4 py-2 text-sm text-white">
          {message}
        </div>
      )}

      <form
        onSubmit={handleAddMember}
        className="mt-6 flex flex-wrap items-end gap-4 rounded border border-webit-panel-border bg-slate-800/40 p-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-webit-fg-muted">Email</span>
          <input
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="editor@example.com"
            className="w-56 rounded border border-webit-panel-border bg-slate-800/60 px-3 py-2 text-white placeholder:text-webit-fg-muted focus:border-webit-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-webit-fg-muted">Rôle</span>
          <select
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as OrgRole)}
            className="rounded border border-webit-panel-border bg-slate-800/60 px-3 py-2 text-white focus:border-webit-accent focus:outline-none"
          >
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={submitting || !addEmail.trim()}
          className="rounded bg-webit-accent/20 px-4 py-2 text-sm font-medium text-white hover:bg-webit-accent/30 disabled:opacity-50"
        >
          {submitting ? 'Ajout…' : 'Ajouter / inviter'}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded border border-webit-panel-border">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-webit-panel-border bg-slate-800/60">
              <th className="p-3 font-medium text-white">Email</th>
              <th className="p-3 font-medium text-white">Nom affiché</th>
              <th className="p-3 font-medium text-white">Rôle</th>
              <th className="p-3 font-medium text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-webit-fg-muted">
                  Aucun membre. Ajoutez un membre par email ci-dessus.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.userId || m.userEmail} className="border-b border-webit-panel-border/60">
                  <td className="p-3 text-white">{m.userEmail}</td>
                  <td className="p-3 text-webit-fg-muted">{m.userDisplayName ?? '—'}</td>
                  <td className="p-3">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value as OrgRole)}
                      className="rounded border border-webit-panel-border bg-slate-800/60 px-2 py-1 text-white focus:border-webit-accent focus:outline-none"
                    >
                      {ORG_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleRemove(m)}
                      className="text-sm text-webit-fg-muted hover:text-red-400"
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OrgMembersPage() {
  return (
    <DashboardShell>
      <OrgMembersInner />
    </DashboardShell>
  );
}

