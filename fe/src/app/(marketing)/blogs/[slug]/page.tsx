import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BlogPostPageClient } from '../post/blog-post-page-client';

export const metadata: Metadata = {
  title: 'Blog Post | FlowDex',
  description: 'Read the latest FlowDex product and community update.',
};

export default async function BlogPostSlugRoute(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  return (
    <Suspense fallback={<div className="section-shell min-h-96 animate-pulse" />}>
      <BlogPostPageClient slug={slug} />
    </Suspense>
  );
}
