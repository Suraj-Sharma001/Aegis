'use client';

import { useState } from 'react';
import { api, SUPPORTED_MODELS } from '..//lib/api';

// Extracted from the old per-app analytics page test console — now used
// standalone on the /playground page (matches LiteLLM's separate
// "Playground" nav item) instead of being buried inside one app's analytics.
export function TestConsole() {
  const [gatewayKey, setGatewayKey] = useState('');
  const [model, setModel] = useState(SUPPORTED_MODELS[2].models[0]);
  const [prompt, setPrompt] = useState('What is the capital of France?');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setTesting(true);
    setResult(null);
    try {
      const res = await api.testCompletion({ gatewayKey, model, prompt });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, data: { error: err.message } });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
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
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm font-mono outline-none appearance-none cursor-pointer"
            >
              {SUPPORTED_MODELS.map((group) => (
                <optgroup key={group.provider} label={group.provider}>
                  {group.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
              ))}
            </select>
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

      {result && (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${
            result.ok ? 'border-accent/30 bg-accent/5' : 'border-danger/30 bg-danger/5'
          }`}
        >
          {result.ok ? (
            <>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${result.data.cache_hit ? 'bg-accent/20 text-accent' : 'bg-surface2 text-muted'}`}>
                  {result.data.cache_hit ? 'CACHE HIT' : 'LIVE CALL'}
                </span>
                <span className="text-xs font-mono text-muted">{result.data.latency_ms}ms</span>
                <span className="text-xs font-mono text-muted">${(result.data.cost_usd ?? 0).toFixed(6)}</span>
                {result.data.similarity_score && (
                  <span className="text-xs font-mono text-muted">similarity {result.data.similarity_score.toFixed(3)}</span>
                )}
              </div>
              <p>{result.data.content}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-danger">{result.data.error || 'Request blocked'}</p>
              {result.data.findings && (
                <ul className="mt-2 space-y-1">
                  {result.data.findings.map((f, i) => (
                    <li key={i} className="font-mono text-xs text-muted">{f.label}: {f.preview}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
