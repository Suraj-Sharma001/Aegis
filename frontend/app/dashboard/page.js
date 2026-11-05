'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../components/Shell';
import { api, getToken } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

function KeyList({ appId, version }) {
  const [keys, setKeys] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listApiKeys(appId).then(setKeys).catch((err) => setError(err.data?.error || err.message));
  }, [appId, version]);

  if (error) return <p className="text-xs text-destructive mt-2">{error}</p>;
  if (!keys) return <div className="mt-3 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>;
  if (keys.length === 0) return <p className="text-xs text-muted-foreground mt-3 text-center py-4">No keys issued yet for this application.</p>;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((k) => (
            <TableRow key={k.id}>
              <TableCell className="font-medium">{k.label}</TableCell>
              <TableCell>
                <Badge variant={k.isActive ? "default" : "secondary"} className="text-xs">
                  {k.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs font-mono">
                {new Date(k.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs font-mono">
                {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [apps, setApps] = useState(null);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppTeamId, setNewAppTeamId] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);
  const [issuingFor, setIssuingFor] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [keyListVersion, setKeyListVersion] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    loadApps();
    loadTeams();
  }, []);

  async function loadApps() {
    try {
      setApps(await api.listApplications());
    } catch (err) {
      setError(err.data?.error || err.message);
    }
  }

  async function loadTeams() {
    try {
      const t = await api.listTeams();
      setTeams(t);
    } catch (err) {
      // Non-fatal
    }
  }

  async function handleCreateApp(e) {
    e.preventDefault();
    if (!newAppTeamId) {
      setError('Please select a team before creating the application.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await api.createApplication(newAppName, newAppTeamId);
      setNewAppName('');
      setNewAppTeamId('');
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
    setError('');
    try {
      const data = await api.createApiKey(appId, `Key issued ${new Date().toLocaleString()}`);
      setRevealedKey({ appId, key: data.apiKey });
      setExpandedApp(appId);
      setKeyListVersion((v) => v + 1);
      await loadApps();
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
          <h1 className="font-display font-semibold text-3xl">Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your AI gateway applications and API keys
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button disabled={teams.length === 0}>
              + New application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create application</DialogTitle>
              <DialogDescription>
                Create a new application to get started with the AI gateway
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateApp} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Application name</Label>
                <Input
                  id="appName"
                  required
                  autoFocus
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. Support Chatbot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select value={newAppTeamId} onValueChange={setNewAppTeamId} required>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Select a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {teams.length === 0 && apps?.length === 0 && (
        <Card className="mb-6 border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-600 dark:text-orange-400">
              You're not on any team yet — ask an Admin to add you to one from the Teams page before creating applications.
            </p>
          </CardContent>
        </Card>
      )}

      {revealedKey && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Gateway key generated
            </CardTitle>
            <CardDescription>
              This key will not be shown again. Store it somewhere safe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-background border border-border rounded-md p-3 mb-4">
              <code className="text-sm font-mono break-all">
                {revealedKey.key}
              </code>
            </div>
            <Button onClick={() => setRevealedKey(null)} variant="outline" size="sm">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {apps === null ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="pt-16 pb-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">No applications yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first application to start using the AI gateway
                </p>
              </div>
              <Button onClick={() => setShowCreate(true)} disabled={teams.length === 0}>
                Create application
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{app.name}</CardTitle>
                      {app.team && (
                        <Badge variant="secondary" className="text-xs">
                          {app.team.name}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="font-mono text-xs">
                      {app._count?.auditLogs ?? 0} requests · {app._count?.apiKeys ?? 0} key(s)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIssueKey(app.id)}
                      disabled={issuingFor === app.id}
                    >
                      {issuingFor === app.id ? 'Issuing…' : 'Issue key'}
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/dashboard/${app.id}`}>
                        View analytics
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    className="text-xs"
                  >
                    {expandedApp === app.id ? '▼ Hide keys' : `▶ View keys (${app._count?.apiKeys ?? 0})`}
                  </Button>
                </div>
                {expandedApp === app.id && <KeyList appId={app.id} version={keyListVersion} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
