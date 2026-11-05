'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { api, getToken } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const STATUS_VARIANTS = {
  SUCCESS: 'default',
  CACHED: 'default',
  ERROR: 'destructive',
  BLOCKED: 'destructive',
  RATE_LIMITED: 'secondary',
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
          <h1 className="font-display font-semibold text-3xl">Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">The 100 most recent requests across every application.</p>
        </div>
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {rows === null ? (
            <div className="p-8">
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No requests logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cache</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Latency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{r.appName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.provider}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.model}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[r.status] || 'secondary'} className="text-xs">
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.cacheHit ? '⚡' : '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">${r.costUsd.toFixed(6)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.latencyMs}ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}
