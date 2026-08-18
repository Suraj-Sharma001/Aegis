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

  // Live test console state
  const [gatewayKey, setGatewayKey] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash-lite');
  const [prompt, setPrompt] = useState('What is the capital of France?');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

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

  async function handleTest(e) {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testCompletion({ gatewayKey, model, prompt });
      setTestResult(result);
      loadAnalytics(); // refresh stats after a real call
    } catch (err) {
      setTestResult({ ok: false, data: { error: err.message } });
    } finally {
      setTesting(false);
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
      <Link href="/dashboard" className="text-sm text-muted hover:text-ink transition-colors">
        ← Applications
      </Link>

      <h1 className="font-display font-semibold text-2xl mt-3 mb-8">Analytics</h1>

      {/* Stat cards */}
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

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
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
                <Tooltip
                  contentStyle={{ background: '#131B2E', border: '1px solid #232E45', borderRadius: 8, fontSize: 12 }}
                />
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
                <Tooltip
                  contentStyle={{ background: '#131B2E', border: '1px solid #232E45', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="requests" fill="#3ED6B5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm py-16 text-center">No requests yet</p>
          )}
        </div>
      </div>

      {/* Live test console */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-sm font-medium mb-1">Test console</p>
        <p className="text-xs text-muted mb-4">Send a real request through the gateway with this app's key.</p>

        <form onSubmit={handleTest} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Gateway API key</label>
            <input
              required
              value={gatewayKey}
              onChange={(e) => setGatewayKey(e.target.value)}
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm font-mono outline-none"
              placeholder="aegis_..."
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs text-muted mb-1.5 font-medium">Model</label>
              <input
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm font-mono outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1.5 font-medium">Prompt</label>
              <input
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={testing}
            className="focus-ring bg-accent text-bg font-semibold text-sm rounded-md px-4 py-2 hover:bg-accentDim transition-colors disabled:opacity-50"
          >
            {testing ? 'Sending…' : 'Send request'}
          </button>
        </form>

        {testResult && (
          <div
            className={`mt-4 rounded-md border px-4 py-3 text-sm ${
              testResult.ok ? 'border-accent/30 bg-accent/5' : 'border-danger/30 bg-danger/5'
            }`}
          >
            {testResult.ok ? (
              <>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      testResult.data.cache_hit ? 'bg-accent/20 text-accent' : 'bg-surface2 text-muted'
                    }`}
                  >
                    {testResult.data.cache_hit ? 'CACHE HIT' : 'LIVE CALL'}
                  </span>
                  <span className="text-xs font-mono text-muted">{testResult.data.latency_ms}ms</span>
                  <span className="text-xs font-mono text-muted">
                    ${(testResult.data.cost_usd ?? 0).toFixed(6)}
                  </span>
                  {testResult.data.similarity_score && (
                    <span className="text-xs font-mono text-muted">
                      similarity {testResult.data.similarity_score.toFixed(3)}
                    </span>
                  )}
                </div>
                <p>{testResult.data.content}</p>
              </>
            ) : (
              <>
                <p className="font-medium text-danger">
                  {testResult.data.error || 'Request blocked'}
                </p>
                {testResult.data.findings && (
                  <ul className="mt-2 space-y-1">
                    {testResult.data.findings.map((f, i) => (
                      <li key={i} className="font-mono text-xs text-muted">
                        {f.label}: {f.preview}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
