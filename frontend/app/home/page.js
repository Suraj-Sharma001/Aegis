'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../components/Shell';
import { ShieldMark } from '../components/ShieldMark';
import { getToken } from '../lib/api';

const PIPELINE = [
  {
    step: '01',
    title: 'Route',
    name: 'Unified Gateway',
    desc: 'One API contract in front of OpenAI, Gemini, Claude, and local Ollama models. The model name picks the provider — nothing else changes in your code.',
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
  { value: '4', label: 'Providers behind one contract' },
  { value: '0', label: 'Plaintext secrets forwarded' },
  { value: 'ms', label: 'Cache reads, not seconds' },
  { value: '$', label: 'Real cost per request, not tokens' },
];

const QUICK_LINKS = [
  { href: '/dashboard', label: 'Dashboard', desc: 'Manage applications and API keys' },
  { href: '/usage', label: 'Usage', desc: 'Spend and cache performance across every app' },
  { href: '/docs', label: 'Docs', desc: 'Authentication, endpoints, and how caching works' },
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
    }
  }, [router]);

  const FLOW = [
    { label: 'Client app', detail: 'POST /v1/chat/completions' },
    { label: 'Cache check', detail: 'Hit → return, ~ms, $0.00' },
    { label: 'Firewall scan', detail: 'PII and keys stripped' },
    { label: 'Provider', detail: 'Routed by model name' },
  ];

  return (
    <Shell>
      {/* Hero */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center py-8 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <ShieldMark size={36} />
            <span className="font-display font-semibold text-lg text-ink">AEGIS</span>
          </div>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl text-ink leading-[1.1] mb-5 max-w-lg">
            Every LLM call, routed, cached, and checked before it leaves the building.
          </h1>
          <p className="text-sm text-muted max-w-md leading-relaxed mb-8">
            AEGIS sits between your applications and OpenAI, Gemini, Claude, and Ollama.
            It authenticates the request, answers it from cache when it can, strips what
            shouldn't leave your network, and logs what it actually cost — in dollars.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="focus-ring bg-accent text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              Go to dashboard
            </Link>
            <Link
              href="/docs"
              className="focus-ring border border-border text-sm font-medium text-ink rounded-lg px-5 py-2.5 hover:border-accent/40 transition-colors"
            >
              Read the docs
            </Link>
          </div>
        </div>

        {/* Request flow visual */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <p className="text-xs text-muted mb-5">One request, end to end</p>
          <div>
            {FLOW.map((row, i) => (
              <div key={row.label}>
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-accent mt-0.5 w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="pb-4">
                    <p className="text-sm text-ink font-medium">{row.label}</p>
                    <p className="text-xs text-muted font-mono mt-0.5">{row.detail}</p>
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
          <div key={s.label} className="bg-surface p-5">
            <p className="font-mono text-2xl text-ink mb-1">{s.value}</p>
            <p className="text-xs text-muted leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="mb-16">
        <h2 className="font-display font-semibold text-xl text-ink mb-1">
          What happens to a request
        </h2>
        <p className="text-sm text-muted mb-6">Four stages, in order, on every call.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {PIPELINE.map((f) => (
            <div key={f.name} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-baseline justify-between mb-2">
                <p className="font-display font-semibold text-sm text-ink">{f.name}</p>
                <span className="font-mono text-xs text-muted">{f.step}</span>
              </div>
              <p className="text-xs text-accent mb-2">{f.title}</p>
              <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="font-display font-semibold text-xl text-ink mb-4">Jump back in</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="focus-ring bg-surface border border-border rounded-xl p-4 hover:border-accent/40 transition-colors"
            >
              <p className="font-medium text-sm text-ink">{l.label}</p>
              <p className="text-xs text-muted mt-1">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}