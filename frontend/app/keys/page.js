'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { api, getToken } from '../lib/api';

export default function KeysPage() {
  const router = useRouter();
  const [groups, setGroups] = useState(null); // [{ app, keys }]
  const [error, setError] = useState('');
  const [issuingFor, setIssuingFor] = useState(null);
  const [revealedKey, setRevealedKey] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
  }, []);

  async function load() {
    try {
      const apps = await api.listApplications();
      const groups = await Promise.all(
        apps.map(async (app) => {
          const keys = await api.listApiKeys(app.id).catch(() => []);
          return { app, keys };
        })
      );
      setGroups(groups);
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  async function handleIssueKey(appId) {
    setIssuingFor(appId);
    try {
      const data = await api.createApiKey(appId, `Key issued ${new Date().toLocaleString()}`);
      setRevealedKey({ appId, key: data.apiKey });
      await load();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setIssuingFor(null);
    }
  }

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl">API Keys</h1>
        <p className="text-muted text-sm mt-1">
          Every gateway key issued across all your applications, in one place.
        </p>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2 mb-6">
          {error}
        </div>
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

      {groups === null ? (
        <div className="text-muted text-sm font-mono">loading…</div>
      ) : groups.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-muted text-sm">No applications yet — create one from the Dashboard first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ app, keys }) => (
            <div key={app.id} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">{app.name}</p>
                <button
                  onClick={() => handleIssueKey(app.id)}
                  disabled={issuingFor === app.id}
                  className="focus-ring text-xs text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-md border border-border hover:border-accent/40 disabled:opacity-50"
                >
                  {issuingFor === app.id ? 'Issuing…' : '+ Issue new key'}
                </button>
              </div>

              {keys.length === 0 ? (
                <p className="text-xs text-muted">No keys issued yet for this application.</p>
              ) : (
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between text-xs border-t border-border pt-2 first:border-t-0 first:pt-0"
                    >
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
              )}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
