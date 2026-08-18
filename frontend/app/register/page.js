'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldMark } from '../components/ShieldMark';
import { api, setToken, setUser } from '../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.register(form);
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <ShieldMark size={40} />
          <h1 className="font-display font-semibold text-2xl">Set up Aegis</h1>
          <p className="text-muted text-sm">Create your organization's gateway</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Organization name</label>
            <input
              required
              value={form.organizationName}
              onChange={update('organizationName')}
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Your name</label>
            <input
              required
              value={form.name}
              onChange={update('name')}
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none"
              placeholder="Suraj Kumar"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              className="focus-ring w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm outline-none"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full bg-accent text-bg font-semibold text-sm rounded-md py-2.5 hover:bg-accentDim transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create organization'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
