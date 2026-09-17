'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../components/Shell';
import { api, getToken } from '../lib/api';

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-xs text-muted font-medium mb-2">{label}</p>
      <p className={`font-mono text-2xl font-medium ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
    </div>
  );
}

export default function UsagePage() {
  const router = useRouter();
  const [rows, setRows] = useState(null); // [{ app, analytics }]
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
      const rows = await Promise.all(
        apps.map(async (app) => {
          const analytics = await api.getAnalytics(app.id).catch(() => null);
          return { app, analytics };
        })
      );
      setRows(rows);
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  if (error) {
    return (
      <Shell>
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">{error}</div>
      </Shell>
    );
  }

  if (rows === null) {
    return (
      <Shell>
        <div className="text-muted text-sm font-mono">loading usage…</div>
      </Shell>
    );
  }

  const totals = rows.reduce(
    (acc, { analytics }) => {
      if (!analytics) return acc;
      acc.requests += analytics.totalRequests;
      acc.cacheHits += analytics.cacheHits;
      acc.cost += analytics.totalCostUsd;
      acc.saved += analytics.estimatedSavingsUsd;
      return acc;
    },
    { requests: 0, cacheHits: 0, cost: 0, saved: 0 }
  );
  const overallHitRate = totals.requests > 0 ? ((totals.cacheHits / totals.requests) * 100).toFixed(1) : '0.0';

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl">Usage</h1>
        <p className="text-muted text-sm mt-1">Spend and cache performance across every application.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total requests" value={totals.requests} />
        <StatCard label="Cache hit rate" value={`${overallHitRate}%`} accent />
        <StatCard label="Total spend" value={`$${totals.cost.toFixed(6)}`} />
        <StatCard label="Saved via cache" value={`$${totals.saved.toFixed(6)}`} accent />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Application</th>
              <th className="px-5 py-3 font-medium">Requests</th>
              <th className="px-5 py-3 font-medium">Cache hit rate</th>
              <th className="px-5 py-3 font-medium">Spend</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted text-sm">
                  No applications yet.
                </td>
              </tr>
            ) : (
              rows.map(({ app, analytics }) => (
                <tr key={app.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3 font-medium">{app.name}</td>
                  <td className="px-5 py-3 font-mono text-muted">{analytics?.totalRequests ?? '—'}</td>
                  <td className="px-5 py-3 font-mono text-muted">
                    {analytics ? `${analytics.cacheHitRate}%` : '—'}
                  </td>
                  <td className="px-5 py-3 font-mono text-muted">
                    {analytics ? `$${analytics.totalCostUsd.toFixed(6)}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/dashboard/${app.id}`} className="text-accent text-xs hover:underline">
                      View details →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
