'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shell } from '../../components/Shell';
import { getToken } from '../../lib/api';
import { DOC_SECTIONS, DocBody, DOC_HEADINGS, slugify } from '../docsContent';
import { DocsNav } from '../DocsNav';

export default function DocPage() {
  const { slug } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
    }
  }, [router]);

  const activeTitle = DOC_SECTIONS.flatMap((s) => s.items).find((i) => i.slug === slug)?.title || 'Documentation';
  const headings = DOC_HEADINGS[slug] || [];

  return (
    <Shell>
      <div className="flex gap-10">
        <DocsNav activeSlug={slug} />

        <article className="flex-1 min-w-0 max-w-2xl">
          <h1 className="font-display font-semibold text-2xl mb-6">{activeTitle}</h1>
          <DocBody slug={slug} />
        </article>

        {/* Right-side "on this page" TOC — auto-generated from DOC_HEADINGS,
            same pattern as LiteLLM's docs site. */}
        {headings.length > 0 && (
          <aside className="w-44 shrink-0 hidden lg:block">
            <div className="sticky top-10">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">On this page</p>
              <div className="space-y-1.5 border-l border-border pl-3">
                {headings.map((h) => (
                  <a
                    key={h}
                    href={`#${slugify(h)}`}
                    className="block text-xs text-muted hover:text-accent transition-colors"
                  >
                    {h}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </Shell>
  );
}
