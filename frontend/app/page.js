'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldMark } from './components/ShieldMark';
import { ThemeToggle } from './components/ThemeToggle';
import { getToken } from './lib/api';

const PIPELINE = [
  {
    step: '01',
    title: 'Route',
    name: 'Unified Gateway',
    desc: 'One API contract in front of OpenAI, Gemini, Claude, Grok, and local Ollama models. The model name picks the provider — nothing else changes in your code.',
  },
  {
    step: '02',
    title: 'Check cache',
    name: 'Semantic Caching',
    desc: 'Hybrid embedding + keyword matching catches repeated-intent questions before they reach a provider, so you pay once for the answer.',
  },
  {
    step: '03',
    title: 'Scan payload',
    name: 'Governance Firewall',
    desc: "Emails, card numbers, and API keys are stripped or blocked before the request leaves your infrastructure.",
  },
  {
    step: '04',
    title: 'Log spend',
    name: 'Cost Ledger',
    desc: 'Every call writes real USD cost and cache-driven savings to the ledger — no placeholder metrics, no estimates.',
  },
];

const STATS = [
  { value: '5', label: 'Providers behind one contract' },
  { value: '98.5%', label: 'Latency cut on cache hits' },
  { value: '$0', label: 'Cost on every cache hit' },
  { value: '0', label: 'Plaintext secrets forwarded' },
];

const QUICK_LINKS = [
  { href: '/login', label: 'Get Started', desc: 'Create your account and start routing', requiresAuth: true },
  { href: '/docs', label: 'Documentation', desc: 'Authentication, endpoints, and how caching works', requiresAuth: false },
  { href: '/login', label: 'Sign In', desc: 'Access your dashboard and applications', requiresAuth: true },
];

export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace('/home');
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          loading aegis
        </div>
      </div>
    );
  }

  const FLOW = [
    { label: 'Client app', detail: 'POST /v1/chat/completions' },
    { label: 'Cache check', detail: 'Hit → return, ~ms, $0.00' },
    { label: 'Firewall scan', detail: 'PII and keys stripped' },
    { label: 'Provider', detail: 'Routed by model name' },
  ];

  return (
    <div className="min-h-screen bg-background">
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
          </nav>
        </div>
      </header>

      {/* Main content with same max-width as Shell */}
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Hero */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center py-8 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <ShieldMark size={36} />
              <span className="font-display font-semibold text-lg">AEGIS</span>
            </div>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.1] mb-5 max-w-lg">
              Every LLM call, routed, cached, and checked before it leaves the building.
            </h1>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8">
              AEGIS sits between your applications and OpenAI, Gemini, Claude, Grok, and Ollama.
              It authenticates the request, answers it from cache when it can, strips what
              shouldn't leave your network, and logs what it actually cost — in dollars.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="bg-primary text-primary-foreground text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/docs"
                className="border border-border text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-accent transition-colors"
              >
                Read the docs
              </Link>
            </div>
          </div>

          {/* Request flow visual */}
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-xs text-muted-foreground mb-5">One request, end to end</p>
            <div>
              {FLOW.map((row, i) => (
                <div key={row.label}>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-primary mt-0.5 w-5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{row.detail}</p>
                    </div>
                  </div>
                  {i < FLOW.length - 1 && <div className="ml-2 w-px h-3 bg-border mb-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden mb-16 border border-border">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card p-5">
              <p className="font-mono text-2xl mb-1">{s.value}</p>
              <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="mb-16">
          <h2 className="font-display font-semibold text-xl mb-1">
            What happens to a request
          </h2>
          <p className="text-sm text-muted-foreground mb-6">Four stages, in order, on every call.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {PIPELINE.map((f) => (
              <div key={f.name} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="font-display font-semibold text-sm">{f.name}</p>
                  <span className="font-mono text-xs text-muted-foreground">{f.step}</span>
                </div>
                <p className="text-xs text-primary mb-2">{f.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="mb-16">
          <h2 className="font-display font-semibold text-xl mb-4">Get Started</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
              >
                <p className="font-medium text-sm">{l.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Code example */}
        <div className="mb-16">
          <h2 className="font-display font-semibold text-xl mb-4">One endpoint. Any provider.</h2>
          <div className="bg-card border border-border rounded-xl p-6">
            <pre className="text-xs font-mono overflow-x-auto text-muted-foreground">
{`curl -X POST https://your-gateway/v1/chat/completions \\
  -H "x-api-key: aegis_<your-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "grok-beta",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}
            </pre>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-b from-primary/5 via-transparent to-transparent border border-border/50 rounded-xl p-12 text-center">
          <h2 className="font-display font-semibold text-2xl mb-3">Run it yourself. Start today.</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Deploy the gateway in an afternoon, with governance and cost tracking on every request.
          </p>
          <Link
            href="/register"
            className="inline-block bg-primary text-primary-foreground font-semibold text-sm rounded-lg px-6 py-3 hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-mono">AEGIS — Enterprise AI Gateway</p>
            <Link href="/docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
