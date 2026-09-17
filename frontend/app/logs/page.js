'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { api, getToken } from '../lib/api';

const STATUS_COLOR = {
  SUCCESS: 'text-accent',
  CACHED: 'text-accent',
  ERROR: 'text-danger',
  BLOCKED: 'text-danger',
  RATE_LIMITED: 'text-warn',
};

export default function LogsPage() {
  const router = useRouter();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

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
      const perApp = await Promise.all(
        apps.map(async (app) => {
          const logs = await api.listAuditLogs(app.id, 50).catch(() => []);
          return logs.map((l) => ({ ...l, appName: app.name }));
        })
      );
      const merged = perApp.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRows(merged.slice(0, 100));
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-2xl">Logs</h1>
          <p className="text-muted text-sm mt-1">The 100 most recent requests across every application.</p>
        </div>
        <button
          onClick={load}
          className="focus-ring text-sm text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-md border border-border hover:border-accent/40"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2 mb-6">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Cache</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Latency</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted text-sm font-mono">loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted text-sm">No requests logged yet.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">{r.appName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.provider}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{r.model}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs font-medium ${STATUS_COLOR[r.status] || 'text-muted'}`}>
                    {r.status}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{r.cacheHit ? '⚡' : '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">${r.costUsd.toFixed(6)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{r.latencyMs}ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
