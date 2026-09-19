'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { api, getToken, PROVIDER_OPTIONS } from '../lib/api';

export default function ProviderKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ provider: 'OPENAI', label: '', apiKey: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
  }, []);

  async function load() {
    try {
      const data = await api.listProviderKeys();
      setKeys(data);
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.addProviderKey({
        provider: form.provider,
        label: form.label || `${form.provider} key`,
        apiKey: form.apiKey,
      });
      setForm({ provider: 'OPENAI', label: '', apiKey: '' });
      setSuccess(`${form.provider} key saved — it's now used for every request that routes there.`);
      await load();
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, provider) {
    if (!confirm(`Remove this ${provider} key? Requests to ${provider} will fail until a new one is added.`)) return;
    try {
      await api.deleteProviderKey(id);
      await load();
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl">Provider Keys</h1>
        <p className="text-muted text-sm mt-1 max-w-2xl">
          Bring your own API key for each provider. Every request your applications make is billed to
          <span className="text-ink font-medium"> your</span> account — nothing routes through a shared
          key. Keys are encrypted at rest and never shown again after saving.
        </p>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2 mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-md px-3 py-2 mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 mb-8">
        <p className="text-sm font-medium mb-4">Add a key</p>
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Provider</label>
            <select
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
            >
              {PROVIDER_OPTIONS.filter((p) => p !== 'OLLAMA').map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Label (optional)</label>
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Production key"
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">API Key</label>
            <input
              required
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm font-mono outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="focus-ring bg-accent text-bg font-semibold text-sm rounded-md px-4 py-2 hover:bg-accentDim transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save key'}
        </button>
      </form>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Provider</th>
              <th className="px-5 py-3 font-medium">Label</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Added</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {keys === null ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted text-sm font-mono">loading…</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted text-sm">No provider keys added yet — requests will fail until you add one for each provider you plan to use.</td></tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3 font-mono text-xs">{k.provider}</td>
                  <td className="px-5 py-3">{k.label}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${k.isActive ? 'text-accent' : 'text-muted'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${k.isActive ? 'bg-accent' : 'bg-muted'}`} />
                      {k.isActive ? 'Active' : 'Replaced'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    {k.isActive && (
                      <button
                        onClick={() => handleDelete(k.id, k.provider)}
                        className="text-xs text-danger hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted mt-4">
        Ollama (local models) needs no key — it runs on your own machine and is always free.
      </p>
    </Shell>
  );
}
