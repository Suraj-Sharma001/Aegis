'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { api, getToken } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export default function KeysPage() {
  const router = useRouter();
  const [groups, setGroups] = useState(null);
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
    setError('');
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
        <h1 className="font-display font-semibold text-3xl">API Keys</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Every gateway key issued across all your applications, in one place.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {revealedKey && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Gateway key generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">This key will not be shown again. Store it somewhere safe.</p>
            <div className="bg-background border border-border rounded-md px-3 py-2 mb-4">
              <code className="text-sm font-mono break-all">{revealedKey.key}</code>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRevealedKey(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {groups === null ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="pt-16 pb-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
                  <path d="m21 2-9.6 9.6"/>
                  <circle cx="7.5" cy="15.5" r="5.5"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">No applications yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create an application from the Dashboard first
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(({ app, keys }) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{app.name}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleIssueKey(app.id)}
                    disabled={issuingFor === app.id}
                  >
                    {issuingFor === app.id ? 'Issuing…' : '+ Issue new key'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {keys.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No keys issued yet for this application.</p>
                ) : (
                  <div className="space-y-3">
                    {keys.map((k) => (
                      <div key={k.id} className="flex items-center justify-between text-sm border-t border-border pt-3 first:border-t-0 first:pt-0">
                        <div className="flex items-center gap-3">
                          <Badge variant={k.isActive ? "default" : "secondary"} className="text-xs">
                            {k.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="font-medium">{k.label}</span>
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">
                          {new Date(k.createdAt).toLocaleDateString()}
                          {k.lastUsedAt ? ` · used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' · never used'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
