'use client';

import { useState } from 'react';
import { api, SUPPORTED_MODELS } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

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
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gatewayKey">Gateway API key</Label>
              <Input
                id="gatewayKey"
                required
                value={gatewayKey}
                onChange={(e) => setGatewayKey(e.target.value)}
                className="font-mono"
                placeholder="aegis_..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono"
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
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Input
                id="prompt"
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={testing} className="w-full">
              {testing ? 'Sending…' : 'Send request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Send a request to see the response
            </div>
          ) : result.ok ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={result.data.cache_hit ? "default" : "secondary"}>
                  {result.data.cache_hit ? 'CACHE HIT' : 'LIVE CALL'}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {result.data.latency_ms}ms
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  ${(result.data.cost_usd ?? 0).toFixed(6)}
                </Badge>
                {result.data.similarity_score && (
                  <Badge variant="outline" className="font-mono text-xs">
                    similarity {result.data.similarity_score.toFixed(3)}
                  </Badge>
                )}
              </div>
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm">{result.data.content}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3">
              <p className="font-medium">{result.data.error || 'Request blocked'}</p>
              {result.data.findings && (
                <ul className="mt-2 space-y-1">
                  {result.data.findings.map((f, i) => (
                    <li key={i} className="font-mono text-xs">
                      {f.label}: {f.preview}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
