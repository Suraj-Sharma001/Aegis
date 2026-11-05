'use client';

import Link from 'next/link';
import { ShieldMark } from './ShieldMark';
import { ThemeToggle } from './ThemeToggle';
import { getToken } from '../lib/api';

export function PublicShell({ children }) {
  const isLoggedIn = getToken();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <ShieldMark size={28} />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight gradient-text">Aegis</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <ThemeToggle />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="bg-primary text-primary-foreground text-sm font-medium rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-primary-foreground text-sm font-medium rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1">
        <main className="max-w-[1400px] mx-auto px-8 py-8">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-mono">AEGIS — Enterprise AI Gateway</p>
            <div className="flex items-center gap-6">
              <Link href="/docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
              {!isLoggedIn && (
                <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
