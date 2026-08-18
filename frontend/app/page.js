'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from './lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted font-mono text-sm">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        loading aegis
      </div>
    </div>
  );
}
