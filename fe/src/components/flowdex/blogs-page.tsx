'use client';

import Link from 'next/link';
import Image from 'next/image';
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

  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Blog"
        title="FlowDex product updates, research, and community news."
        description="Read the latest progress from the FlowDex team across product development, architecture, security, and launch access."
        meta={[
          { label: 'Topics', value: 'Product • Research • Security' },
          { label: 'Publishing', value: 'FlowDex Team' },
          { label: 'Format', value: 'Long-form Updates' },
          { label: 'Access', value: 'Public' },
        ]}
      />

      <MarketingContentShell>
        {query.isPending ? (
          <div className="grid gap-5 md:grid-cols-2" aria-label="Loading blog posts">
            {Array.from({ length: 4 }, (_, index) => (
              <GlassPanel key={index} className="h-64 animate-pulse bg-[var(--card-bg)]">&nbsp;</GlassPanel>
            ))}
          </div>
        ) : query.isError ? (
          <GlassPanel className="p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--text)]">The blog is temporarily unavailable.</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">Please try loading the posts again.</p>
            <Button variant="glass" className="mt-5" onClick={() => query.refetch()}>Try again</Button>
          </GlassPanel>
        ) : posts.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--text)]">No posts published yet.</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">The first FlowDex update will appear here when it is ready.</p>
          </GlassPanel>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {posts.map(post => (
              <Link key={post.id} href={ROUTES.MARKETING.blogPost(post.slug)} className="group block h-full">
                <GlassPanel className="flex h-full flex-col overflow-hidden p-0 transition-transform group-hover:-translate-y-1 group-hover:border-[var(--accent-border)]">
                  {post.coverImageUrl ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image
                        src={post.coverImageUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : null}
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
