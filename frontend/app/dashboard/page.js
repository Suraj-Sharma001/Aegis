'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../components/Shell';
import { api, getToken } from '../lib/api';

function KeyList({ appId }) {
  const [keys, setKeys] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listApiKeys(appId).then(setKeys).catch((err) => setError(err.data?.error || err.message));
  }, [appId]);

  if (error) return <p className="text-xs text-danger mt-2">{error}</p>;
  if (!keys) return <p className="text-xs text-muted font-mono mt-2">loading keys…</p>;
  if (keys.length === 0) return <p className="text-xs text-muted mt-2">No keys issued yet for this application.</p>;

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      {keys.map((k) => (
        <div key={k.id} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${k.isActive ? 'bg-accent' : 'bg-muted'}`} />
            <span className="font-medium">{k.label}</span>
          </div>
          <span className="text-muted font-mono">
            created {new Date(k.createdAt).toLocaleDateString()}
            {k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' · never used'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [apps, setApps] = useState(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null); // { appId, key }
  const [issuingFor, setIssuingFor] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null); // which app's key list is open
  const [keyListVersion, setKeyListVersion] = useState(0); // bump to force KeyList refetch

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    loadApps();
  }, []);

  async function loadApps() {
    try {
      const data = await api.listApplications();
      setApps(data);
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  async function handleCreateApp(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createApplication(newAppName);
      setNewAppName('');
      setShowCreate(false);
      await loadApps();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleIssueKey(appId) {
    setIssuingFor(appId);
    try {
      const data = await api.createApiKey(appId, `Key issued ${new Date().toLocaleString()}`);
      setRevealedKey({ appId, key: data.apiKey });
      setExpandedApp(appId);
      setKeyListVersion((v) => v + 1); // force the key list to refetch and show the new one
      await loadApps(); // refresh key counts
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setIssuingFor(null);
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-2xl">Applications</h1>
          <p className="text-muted text-sm mt-1">Each application gets its own gateway keys and usage trail.</p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="focus-ring bg-accent text-bg font-semibold text-sm rounded-md px-4 py-2 hover:bg-accentDim transition-colors"
        >
          + New application
        </button>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2 mb-6">
          {error}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreateApp}
          className="bg-surface border border-border rounded-xl p-5 mb-6 flex items-end gap-3"
        >
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1.5 font-medium">Application name</label>
            <input
              required
              autoFocus
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none"
              placeholder="e.g. Support Chatbot"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="focus-ring bg-accent text-bg font-semibold text-sm rounded-md px-4 py-2 hover:bg-accentDim transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      {revealedKey && (
        <div className="bg-surface border border-accent/40 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <p className="text-sm font-medium text-accent">Gateway key generated — save it now</p>
          </div>
          <p className="text-xs text-muted mb-3">This key will not be shown again. Store it somewhere safe.</p>
          <code className="block bg-bg border border-border rounded-md px-3 py-2 text-sm font-mono text-ink break-all">
            {revealedKey.key}
          </code>
          <button
            onClick={() => setRevealedKey(null)}
            className="focus-ring text-xs text-muted hover:text-ink mt-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {apps === null ? (
        <div className="text-muted text-sm font-mono">loading…</div>
      ) : apps.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-muted text-sm">No applications yet. Create one to get a gateway API key.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-surface border border-border rounded-xl p-5 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="text-xs text-muted font-mono mt-1">
                    {app._count?.auditLogs ?? 0} requests · {app._count?.apiKeys ?? 0} key(s) issued
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    className="focus-ring text-sm text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-md border border-border hover:border-accent/40"
                  >
                    {expandedApp === app.id ? 'Hide keys' : `View keys (${app._count?.apiKeys ?? 0})`}
                  </button>
                  <button
                    onClick={() => handleIssueKey(app.id)}
                    disabled={issuingFor === app.id}
                    className="focus-ring text-sm text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-md border border-border hover:border-accent/40 disabled:opacity-50"
                  >
                    {issuingFor === app.id ? 'Issuing…' : 'Issue new key'}
                  </button>
                  <Link
                    href={`/dashboard/${app.id}`}
                    className="focus-ring text-sm text-bg bg-accent font-semibold px-3 py-1.5 rounded-md hover:bg-accentDim transition-colors"
                  >
                    View analytics
                  </Link>
                </div>
              </div>
              {expandedApp === app.id && <KeyList key={keyListVersion} appId={app.id} />}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
