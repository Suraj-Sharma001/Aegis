'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/Shell';
import { TestConsole } from '../components/TestConsole';
import { getToken } from '../lib/api';

export default function PlaygroundPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl">Playground</h1>
        <p className="text-muted text-sm mt-1">
          Send a real request through the gateway with any of your issued keys.
        </p>
      </div>
      <TestConsole />
    </Shell>
  );
}
