'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Shell } from '../../components/Shell';
import { api, getToken } from '../../lib/api';

const PIE_COLORS = ['#3ED6B5', '#232E45'];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-xs text-muted font-medium mb-2">{label}</p>
      <p className={`font-mono text-2xl font-medium ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    loadAnalytics();
  }, [id]);

  async function loadAnalytics() {
    try {
      const result = await api.getAnalytics(id);
      setData(result);
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

  if (!data) {
    return (
      <Shell>
        <div className="text-muted text-sm font-mono">loading analytics…</div>
      </Shell>
    );
  }

  const pieData = [
    { name: 'Cache hits', value: data.cacheHits },
    { name: 'Live calls', value: data.totalRequests - data.cacheHits },
  ];

  const providerData = Object.entries(data.byProvider || {}).map(([provider, stats]) => ({
    provider,
    requests: stats.requests,
    cost: Number(stats.costUsd.toFixed(6)),
  }));

  return (
    <Shell>
      <div className="flex items-center justify-between mb-3">
        <Link href="/dashboard" className="text-sm text-muted hover:text-ink transition-colors">
          ← Applications
        </Link>
        <Link
          href="/playground"
          className="focus-ring text-sm text-bg bg-accent font-semibold px-3 py-1.5 rounded-md hover:bg-accentDim transition-colors"
        >
          Try in Playground →
        </Link>
      </div>

      <h1 className="font-display font-semibold text-2xl mt-3 mb-8">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total requests" value={data.totalRequests} />
        <StatCard
          label="Cache hit rate"
          value={`${data.cacheHitRate}%`}
          sub={`${data.cacheHits} of ${data.totalRequests}`}
          accent
        />
        <StatCard label="Total spend" value={`$${data.totalCostUsd.toFixed(6)}`} />
        <StatCard label="Saved via cache" value={`$${data.estimatedSavingsUsd.toFixed(6)}`} accent />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted font-medium mb-4">Cache performance</p>
          {data.totalRequests > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#131B2E', border: '1px solid #232E45', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm py-16 text-center">No requests yet</p>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted font-medium mb-4">Requests by provider</p>
          {providerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={providerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232E45" />
                <XAxis dataKey="provider" stroke="#8B95AC" fontSize={11} />
                <YAxis stroke="#8B95AC" fontSize={11} />
                <Tooltip contentStyle={{ background: '#131B2E', border: '1px solid #232E45', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="requests" fill="#3ED6B5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm py-16 text-center">No requests yet</p>
          )}
        </div>
      </div>
    </Shell>
  );
}
