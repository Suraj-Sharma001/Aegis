'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldMark } from './components/ShieldMark';
import { getToken } from './lib/api';

const COLUMNS = [
  {
    heading: 'Providers',
    items: ['OpenAI', 'Google Gemini', 'Anthropic Claude', 'Ollama (local)'],
  },
  {
    heading: 'Controls',
    items: ['Governance & PII Firewall', 'Semantic Caching', 'Role-based Access (Admin/Dev/Viewer)'],
  },
  {
    heading: 'Operations',
    items: ['Real USD Cost Tracking', 'Full Request Audit Log', 'Per-App Usage Analytics'],
  },
];

const PROVIDER_BADGES = ['OpenAI', 'Gemini', 'Claude', 'Ollama'];

// Real, measured numbers only — no fabricated benchmarks or testimonials.
const STATS = [
  { value: '4', label: 'LLM providers behind one API' },
  { value: '98.5%', label: 'latency cut on cache hits (measured)' },
  { value: '4 / 4', label: 'core phases built & verified' },
  { value: '$0', label: 'cost on every cache hit' },
];

export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace('/dashboard');
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-console">
        <div className="flex items-center gap-3 text-muted font-mono text-sm">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          loading aegis
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-console">
      {/* Sticky top nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <ShieldMark size={22} />
            <span className="font-display font-semibold text-base tracking-tight">Aegis</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
            <Link href="/" className="text-ink">AI Gateway</Link>
            <Link href="/docs" className="hover:text-ink transition-colors">Docs</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link
              href="/login"
              className="focus-ring text-sm text-bg bg-accent font-semibold px-3.5 py-1.5 rounded-md hover:bg-accentDim transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-14 text-center">
        <p className="text-xs font-mono text-muted mb-4">Self-hosted and open architecture.</p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl text-ink leading-tight mb-6">
          The Enterprise AI Gateway
        </h1>

        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10 text-left">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">{col.heading}</p>
              <ul className="space-y-1.5">
                {col.items.map((item) => (
                  <li key={item} className="text-sm text-muted">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="focus-ring bg-accent text-bg font-semibold text-sm rounded-md px-5 py-2.5 hover:bg-accentDim transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/docs"
            className="focus-ring text-sm text-ink border border-border rounded-md px-5 py-2.5 hover:border-accent/40 transition-colors"
          >
            View Docs
          </Link>
        </div>
        <p className="text-xs text-muted mt-4">Self-host in minutes. No credit card.</p>
      </section>

      {/* App → Gateway → Providers diagram */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-surface border border-border rounded-xl p-8">
          <div className="grid sm:grid-cols-3 items-center gap-4 text-center">
            <div>
              <div className="bg-surface2 border border-border rounded-lg py-4 px-3">
                <p className="text-sm font-medium text-ink">Your Application</p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted text-xl mb-2">→</span>
              <div className="bg-accent/10 border border-accent/40 rounded-lg py-4 px-3 w-full">
                <p className="text-sm font-semibold text-accent">AEGIS GATEWAY</p>
                <p className="text-[10px] text-muted mt-1">Cache · Governance · Routing · Cost</p>
              </div>
              <span className="text-muted text-xl mt-2">→</span>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDER_BADGES.map((p) => (
                  <div key={p} className="bg-surface2 border border-border rounded-lg py-2.5 px-2">
                    <p className="text-xs font-mono text-muted">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — real numbers only */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {STATS.map((s) => (
            <div key={s.label} className="bg-surface p-5 text-center">
              <p className="font-mono text-2xl text-accent mb-1">{s.value}</p>
              <p className="text-xs text-muted leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code snippet */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted font-mono mb-3">One endpoint. Any provider.</p>
          <pre className="text-xs font-mono text-ink overflow-x-auto whitespace-pre-wrap">
{`curl -X POST https://your-gateway/v1/chat/completions \\
  -H "x-api-key: aegis_<your key>" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"Hello"}]}'`}
          </pre>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border py-16 text-center">
        <h2 className="font-display font-semibold text-2xl text-ink mb-3">Run it yourself. Start today.</h2>
        <p className="text-sm text-muted mb-6 max-w-md mx-auto">
          Deploy the gateway in an afternoon, with governance and cost tracking on every request.
        </p>
        <Link
          href="/login"
          className="focus-ring inline-block bg-accent text-bg font-semibold text-sm rounded-md px-5 py-2.5 hover:bg-accentDim transition-colors"
        >
          Get Started
        </Link>
      </section>

      <footer className="border-t border-border py-8">
        <p className="text-center text-xs text-muted font-mono">AEGIS — Enterprise AI Gateway</p>
      </footer>
    </div>
  );
}
