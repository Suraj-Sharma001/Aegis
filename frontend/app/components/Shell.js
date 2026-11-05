'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldMark } from './ShieldMark';
import { IconHome, IconKey, IconChart, IconBook, IconLogout, IconPlay, IconList, IconCloud, IconUsers } from './icons';
import { clearToken, getUser } from '../lib/api';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

function buildNavGroups(user) {
  const groups = [
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

  if (user?.role === 'ADMIN') {
    groups.push({
      label: 'Access Control',
      items: [
        { href: '/teams', label: 'Teams', icon: IconUsers, match: (p) => p.startsWith('/teams') },
      ],
    });
  }

  return groups;
}

export function Shell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();
  const navGroups = buildNavGroups(user);

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar with gradient overlay */}
      <aside className="w-72 shrink-0 border-r border-border/50 flex flex-col h-screen sticky top-0 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link
            href="/home"
            className="flex items-center gap-3 px-6 h-20 border-b border-border/50 hover:bg-accent/5 transition-all group"
          >
            <div className="relative">
              <ShieldMark size={28} />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight gradient-text">Aegis</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>{group.label}</span>
                  <div className="flex-1 h-px bg-border/50" />
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = item.match(pathname);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all relative group",
                          active
                            ? 'bg-primary/10 text-primary shadow-lg shadow-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                        )}
                      >
                        {/* Active indicator bar */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-lg shadow-primary/50" />
                        )}

                        <div className={cn(
                          "transition-all",
                          active && "scale-110"
                        )}>
                          <Icon />
                        </div>
                        {item.label}

                        {/* Hover glow */}
                        {!active && (
                          <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <Separator className="opacity-50" />

          {/* User section with glass effect */}
          <div className="px-4 py-5 glass m-2 rounded-xl">
            {user && (
              <div className="px-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold truncate flex-1" title={user.email}>
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <ThemeToggle />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground font-mono truncate flex-1">
                    {user.email}
                  </p>
                  {user.role === 'ADMIN' && (
                    <Badge variant="default" className="text-[10px] py-0 h-4 px-1.5">Admin</Badge>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group"
            >
              <IconLogout />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area with better spacing */}
      <div className="flex-1 min-w-0">
        <main className="max-w-[1400px] mx-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
