import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BlogPostPageClient } from './blog-post-page-client';

export const metadata: Metadata = {
  title: 'Blog Post | FlowDex',
  description: 'Read the latest FlowDex product and community update.',
};

export default function BlogPostRoute() {
  return (
    <Suspense fallback={<div className="section-shell min-h-96 animate-pulse" />}>
      <BlogPostPageClient />
    </Suspense>
  );
}
