'use client';

import { useRouter } from 'next/navigation';
import { ShieldMark } from './ShieldMark';
import { clearToken, getUser } from '../lib/api';

export function Shell({ children }) {
  const router = useRouter();
  const user = getUser();

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldMark size={24} />
            <span className="font-display font-semibold text-lg tracking-tight">Aegis</span>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="text-sm text-muted font-mono">{user.email}</span>}
            <button
              onClick={handleLogout}
              className="focus-ring text-sm text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-md border border-border hover:border-accent/40"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
