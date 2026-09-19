'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldMark } from './ShieldMark';
import { IconHome, IconKey, IconChart, IconBook, IconLogout, IconPlay, IconList, IconCloud } from './icons';
import { clearToken, getUser } from '../lib/api';

const NAV_GROUPS = [
  {
    label: 'AI Gateway',
    items: [
      { href: '/dashboard', label: 'Applications', icon: IconHome, match: (p) => p === '/dashboard' || p.startsWith('/dashboard/') },
      { href: '/keys', label: 'API Keys', icon: IconKey, match: (p) => p.startsWith('/keys') },
      { href: '/provider-keys', label: 'Provider Keys', icon: IconCloud, match: (p) => p.startsWith('/provider-keys') },
      { href: '/playground', label: 'Playground', icon: IconPlay, match: (p) => p.startsWith('/playground') },
    ],
  },
  {
    label: 'Observability',
    items: [
      { href: '/usage', label: 'Usage', icon: IconChart, match: (p) => p.startsWith('/usage') },
      { href: '/logs', label: 'Logs', icon: IconList, match: (p) => p.startsWith('/logs') },
    ],
  },
  {
    label: 'Developer Tools',
    items: [
      { href: '/docs', label: 'Docs', icon: IconBook, match: (p) => p.startsWith('/docs') },
    ],
  },
];

export function Shell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
        <Link
          href="/home"
          className="focus-ring flex items-center gap-2.5 px-5 h-16 border-b border-border hover:bg-surface2 transition-colors"
        >
          <ShieldMark size={22} />
          <span className="font-display font-semibold text-base tracking-tight">Aegis</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.match(pathname);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`focus-ring flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? 'bg-accent/10 text-accent font-medium border border-accent/25'
                          : 'text-muted hover:text-ink hover:bg-surface2 border border-transparent'
                      }`}
                    >
                      <Icon />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          {user && (
            <p className="px-3 text-xs text-muted font-mono mb-2 truncate" title={user.email}>
              {user.email}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="focus-ring w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted hover:text-ink hover:bg-surface2 transition-colors"
          >
            <IconLogout />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="max-w-6xl mx-auto px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
