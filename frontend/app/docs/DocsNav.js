'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DOC_SECTIONS } from '../docs/docsContent';
import { IconSearch, IconChevronDown } from '../components/icons';

export function DocsNav({ activeSlug }) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(new Set());

  const filtered = useMemo(() => {
    if (!query.trim()) return DOC_SECTIONS;
    const q = query.toLowerCase();
    return DOC_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.title.toLowerCase().includes(q)),
    })).filter((section) => section.items.length > 0);
  }, [query]);

  function toggleSection(name) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <nav className="w-48 shrink-0 hidden md:block">
      <div className="sticky top-10 space-y-4">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs…"
            className="w-full bg-muted border border-border rounded-md pl-8 pr-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-5">
          {filtered.map((section) => {
            const isCollapsed = collapsed.has(section.section);
            return (
              <div key={section.section}>
                <button
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between px-0 py-0.5 mb-1.5 text-left focus:outline-none"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {section.section}
                  </span>
                  <IconChevronDown className={`text-muted-foreground transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/docs/${item.slug}`}
                        className={`block px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                          item.slug === activeSlug
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground px-1">No matching pages.</p>}
        </div>
      </div>
    </nav>
  );
}
