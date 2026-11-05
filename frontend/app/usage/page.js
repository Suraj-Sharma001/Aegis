'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../components/Shell';
import { api, getToken } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

function StatCard({ label, value, accent }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
        <p className={`font-mono text-2xl font-semibold ${accent ? 'text-primary' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function UsagePage() {
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
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3">{error}</div>
      </Shell>
    );
  }

  if (rows === null) {
    return (
      <Shell>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
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
        <h1 className="font-display font-semibold text-3xl">Usage</h1>
        <p className="text-muted-foreground text-sm mt-1">Spend and cache performance across every application.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total requests" value={totals.requests} />
        <StatCard label="Cache hit rate" value={`${overallHitRate}%`} accent />
        <StatCard label="Total spend" value={`$${totals.cost.toFixed(6)}`} />
        <StatCard label="Saved via cache" value={`$${totals.saved.toFixed(6)}`} accent />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Cache hit rate</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No applications yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ app, analytics }) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{analytics?.totalRequests ?? '—'}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {analytics ? `${analytics.cacheHitRate}%` : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {analytics ? `$${analytics.totalCostUsd.toFixed(6)}` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/${app.id}`} className="text-primary text-xs hover:underline font-medium">
                        View details →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  );
}
