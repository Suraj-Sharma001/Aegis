'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { api, getToken, PROVIDER_OPTIONS } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

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
        <h1 className="font-display font-semibold text-3xl">Provider Keys</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Bring your own API key for each provider. Every request your applications make is billed to
          <span className="text-foreground font-medium"> your</span> account — nothing routes through a shared
          key. Keys are encrypted at rest and never shown again after saving.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3 mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-primary bg-primary/10 border border-primary/30 rounded-md px-4 py-3 mb-6">
          {success}
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add a provider key</CardTitle>
          <CardDescription>Configure your API keys for OpenAI, Claude, or Gemini</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={form.provider}
                  onValueChange={(value) => setForm((f) => ({ ...f, provider: value }))}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.filter((p) => p !== 'OLLAMA').map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Production key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  required
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="font-mono"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save key'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your provider keys</CardTitle>
          <CardDescription>Manage your configured API keys</CardDescription>
        </CardHeader>
        <CardContent>
          {keys === null ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
                  <path d="m21 2-9.6 9.6"/>
                  <circle cx="7.5" cy="15.5" r="5.5"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-1">No provider keys yet</h3>
              <p className="text-sm text-muted-foreground">
                Add your first provider key to start routing requests
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-mono text-xs font-medium">{k.provider}</TableCell>
                    <TableCell>{k.label}</TableCell>
                    <TableCell>
                      <Badge variant={k.isActive ? "default" : "secondary"} className="text-xs">
                        {k.isActive ? 'Active' : 'Replaced'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {k.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(k.id, k.provider)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Ollama (local models) needs no key — it runs on your own machine and is always free.
          </p>
        </CardContent>
      </Card>
    </Shell>
  );
}
