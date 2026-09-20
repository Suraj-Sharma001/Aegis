'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { api, getToken, getUser } from '../lib/api';

function MemberList({ teamId, refreshKey }) {
  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listTeamMembers(teamId).then(setMembers).catch((err) => setError(err.data?.error || err.message));
  }, [teamId, refreshKey]);

  if (error) return <p className="text-xs text-danger mt-2">{error}</p>;
  if (!members) return <p className="text-xs text-muted font-mono mt-2">loading…</p>;
  if (members.length === 0) return <p className="text-xs text-muted mt-2">No members yet.</p>;

  return (
    <div className="mt-3 space-y-1.5">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between text-xs">
          <span>{m.name} <span className="text-muted">({m.email})</span></span>
          <span className="font-mono text-muted">{m.role}</span>
        </div>
      ))}
    </div>
  );
}

export default function TeamsPage() {
  const router = useRouter();
  const user = getUser();
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [memberForm, setMemberForm] = useState({ email: '', name: '', password: '', role: 'DEVELOPER' });
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    load();
  }, []);

  async function load() {
    try {
      setTeams(await api.listTeams());
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createTeam(newTeamName);
      setNewTeamName('');
      await load();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember(e, teamId) {
    e.preventDefault();
    setAddingMember(true);
    try {
      await api.addTeamMember(teamId, memberForm);
      setMemberForm({ email: '', name: '', password: '', role: 'DEVELOPER' });
      setRefreshKey((k) => k + 1);
      await load();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setAddingMember(false);
    }
  }

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl">Teams</h1>
        <p className="text-muted text-sm mt-1 max-w-2xl">
          Team members only see applications, analytics, and logs for their own team. Admins see everything
          across the organization regardless of team.
        </p>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateTeam} className="bg-surface border border-border rounded-xl p-5 mb-6 flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1.5 font-medium">New team name</label>
          <input
            required
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none"
            placeholder="e.g. Support Bot Team"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="focus-ring bg-accent text-bg font-semibold text-sm rounded-md px-4 py-2 hover:bg-accentDim transition-colors disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create team'}
        </button>
      </form>

      {teams === null ? (
        <div className="text-muted text-sm font-mono">loading…</div>
      ) : teams.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-muted text-sm">No teams yet — create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{team.name}</p>
                  <p className="text-xs text-muted font-mono mt-1">
                    {team._count?.members ?? 0} member(s) · {team._count?.applications ?? 0} application(s)
                  </p>
                </div>
                <button
                  onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                  className="focus-ring text-sm text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-md border border-border hover:border-accent/40"
                >
                  {expandedTeam === team.id ? 'Hide' : 'Manage members'}
                </button>
              </div>

              {expandedTeam === team.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <MemberList teamId={team.id} refreshKey={refreshKey} />

                  <form
                    onSubmit={(e) => handleAddMember(e, team.id)}
                    className="mt-4 grid sm:grid-cols-4 gap-2 items-end"
                  >
                    <div>
                      <label className="block text-xs text-muted mb-1 font-medium">Email</label>
                      <input
                        required
                        type="email"
                        value={memberForm.email}
                        onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))}
                        className="focus-ring w-full bg-surface2 border border-border rounded-md px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1 font-medium">Name</label>
                      <input
                        value={memberForm.name}
                        onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="if new user"
                        className="focus-ring w-full bg-surface2 border border-border rounded-md px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1 font-medium">Password</label>
                      <input
                        type="password"
                        value={memberForm.password}
                        onChange={(e) => setMemberForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="if new user"
                        className="focus-ring w-full bg-surface2 border border-border rounded-md px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={memberForm.role}
                        onChange={(e) => setMemberForm((f) => ({ ...f, role: e.target.value }))}
                        className="focus-ring bg-surface2 border border-border rounded-md px-2 py-1.5 text-xs outline-none cursor-pointer"
                      >
                        <option value="DEVELOPER">Developer</option>
                        <option value="VIEWER">Viewer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        type="submit"
                        disabled={addingMember}
                        className="focus-ring bg-accent text-bg font-semibold text-xs rounded-md px-3 py-1.5 hover:bg-accentDim transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                  <p className="text-[11px] text-muted mt-2">
                    If the email already has an account in this org, they're just added to this team — name/password are ignored.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
