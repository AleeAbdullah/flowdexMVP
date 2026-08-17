'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BlogCardThumbnail } from './blog-card-thumbnail';
import { MarketingContentShell, MarketingCtaBand, MarketingPageHero } from './marketing-content';
import { GlassPanel } from '@/components/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublicBlogPosts } from '@/dal/app/blogs/blogs.services';
import { ArrowRight } from '@/icons';
import { ROUTES } from '@/routes';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function BlogsPage() {
  const query = usePublicBlogPosts();
  const posts = query.data?.items ?? [];
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = useMemo(
    () => [...new Set(posts.map(post => post.category))].sort((left, right) => left.localeCompare(right)),
    [posts],
  );
  const visiblePosts = activeCategory === 'All'
    ? posts
    : posts.filter(post => post.category === activeCategory);

  return (
    <div className="pb-12">
      <MarketingPageHero
        compact
        eyebrow="Blog"
        title="FlowDex product updates, research, and community news."
        description="Read the latest progress from the FlowDex team across product development, architecture, security, and launch access."
      />

      <MarketingContentShell>
        {posts.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter posts by category">
            {['All', ...categories].map(category => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={activeCategory === category ? 'brand' : 'glass'}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        ) : null}
        {query.isPending ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading blog posts">
            {Array.from({ length: 6 }, (_, index) => (
              <GlassPanel key={index} className="h-64 animate-pulse bg-[var(--card-bg)]">&nbsp;</GlassPanel>
            ))}
          </div>
        ) : query.isError ? (
          <GlassPanel className="p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--text)]">The blog is temporarily unavailable.</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">Please try loading the posts again.</p>
            <Button variant="glass" className="mt-5" onClick={() => query.refetch()}>Try again</Button>
          </GlassPanel>
        ) : visiblePosts.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--text)]">
              {posts.length ? 'No posts in this category.' : 'No posts published yet.'}
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {posts.length ? 'Choose another category to continue browsing.' : 'The first FlowDex update will appear here when it is ready.'}
            </p>
          </GlassPanel>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visiblePosts.map(post => (
              <Link key={post.id} href={ROUTES.MARKETING.blogPost(post.slug)} className="group block h-full">
                <GlassPanel className="flex h-full flex-col overflow-hidden p-0 transition-transform group-hover:-translate-y-1 group-hover:border-[var(--accent-border)]">
                  <BlogCardThumbnail src={post.coverImageUrl} />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="brand">{post.category}</Badge>
                      <span className="text-xs text-[var(--muted)]">{dateFormatter.format(new Date(post.publishedAt))}</span>
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-[var(--text)] group-hover:text-[var(--accent-strong)]">{post.title}</h2>
                    <p className="mt-4 flex-1 text-sm leading-8 text-[var(--muted)]">{post.summary}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]">
                      Read article
                      <ArrowRight aria-hidden className="h-4 w-4" />
                    </span>
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        )}
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Explore the FlowDex thesis and launch access.',
          body: 'Read the current whitepaper or continue into the live purchase experience.',
          primary: { href: ROUTES.MARKETING.BUY, label: 'Buy Now' },
          secondary: { href: ROUTES.ASSETS.WHITEPAPER_PDF, label: 'Read Whitepaper', newTab: true },
        }}
      />
    </div>
  );
}
