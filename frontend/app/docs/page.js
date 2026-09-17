'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_DOC_SLUGS } from './docsContent';

export default function DocsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/docs/${ALL_DOC_SLUGS[0]}`);
  }, [router]);
  return null;
}
