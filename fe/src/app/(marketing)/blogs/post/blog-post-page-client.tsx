'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { BlogRichText } from '@/components/flowdex/blog-rich-text';
import { BlogCardThumbnail } from '@/components/flowdex/blog-card-thumbnail';
import { MarketingContentShell, MarketingPageHero } from '@/components/flowdex/marketing-content';
import { GlassPanel } from '@/components/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublicBlogPost, usePublicBlogPosts } from '@/dal/app/blogs/blogs.services';
import { ArrowLeft, ArrowRight } from '@/icons';
import { ROUTES } from '@/routes';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function BlogPostPageClient(props: { slug?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const slug = props.slug?.trim() || searchParams.get('slug')?.trim() || '';
  const query = usePublicBlogPost(slug);
  const postsQuery = usePublicBlogPosts();
  useEffect(() => {
    if (slug && pathname.replace(/\/$/, '') === '/blogs/post') {
      router.replace(ROUTES.MARKETING.blogPost(slug));
    }
  }, [pathname, router, slug]);
  const relatedPosts = useMemo(() => {
    const post = query.data;
    if (!post) {
      return [];
    }

    const candidates = (postsQuery.data?.items ?? []).filter(candidate => candidate.id !== post.id);
    return [
      ...candidates.filter(candidate => candidate.category === post.category),
      ...candidates.filter(candidate => candidate.category !== post.category),
    ].slice(0, 3);
  }, [postsQuery.data?.items, query.data]);

  if (!slug) {
    return <UnavailablePost title="No blog post selected." />;
  }

  if (query.isPending) {
    return <div className="section-shell min-h-[32rem] animate-pulse rounded-[1.35rem] bg-[var(--card-bg)]" />;
  }

  if (query.isError || !query.data) {
    return <UnavailablePost title="This blog post is not available." />;
  }

  const post = query.data;

  return (
    <article className="pb-12">
      <MarketingPageHero
        compact
        eyebrow={post.category}
        title={post.title}
        description={post.summary}
        meta={[
          { label: 'Published', value: dateFormatter.format(new Date(post.publishedAt)) },
          { label: 'Category', value: post.category },
        ]}
        actions={(
          <Button variant="glass" asChild>
            <Link href={ROUTES.MARKETING.BLOGS}>
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        )}
      />
      <MarketingContentShell>
        <div className="mx-auto max-w-4xl">
          <BlogRichText content={post.bodyHtml} />
          <GlassPanel className="mt-10 flex items-start gap-4 p-5 md:p-6">
            <Image
              src="/icon.svg"
              alt="FlowDex"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-xl border border-[var(--card-border)] bg-[var(--accent-bg)] p-2"
            />
            <div>
              <div className="text-xs font-bold tracking-[0.24em] text-[var(--cyan)] uppercase">Written by</div>
              <div className="mt-1 text-lg font-bold text-[var(--text)]">FlowDex Team</div>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Product, research, security, and community updates from the team building FlowDex.
              </p>
            </div>
          </GlassPanel>
        </div>

        {relatedPosts.length ? (
          <section className="mt-14" aria-labelledby="related-posts-heading">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold tracking-[0.24em] text-[var(--cyan)] uppercase">Continue reading</div>
                <h2 id="related-posts-heading" className="font-heading mt-2 text-2xl font-bold text-[var(--text)]">Related posts</h2>
              </div>
              <Button variant="glass" size="sm" asChild>
                <Link href={ROUTES.MARKETING.BLOGS}>View all</Link>
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedPosts.map(relatedPost => (
                <Link key={relatedPost.id} href={ROUTES.MARKETING.blogPost(relatedPost.slug)} className="group block h-full">
                  <GlassPanel className="flex h-full flex-col overflow-hidden p-0 transition-transform group-hover:-translate-y-1 group-hover:border-[var(--accent-border)]">
                    <BlogCardThumbnail src={relatedPost.coverImageUrl} />
                    <div className="flex flex-1 flex-col p-5">
                      <Badge variant="brand" className="self-start">{relatedPost.category}</Badge>
                      <h3 className="mt-4 text-lg font-bold text-[var(--text)] group-hover:text-[var(--accent-strong)]">{relatedPost.title}</h3>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]">
                        Read article
                        <ArrowRight aria-hidden className="h-4 w-4" />
                      </span>
                    </div>
                  </GlassPanel>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </MarketingContentShell>
    </article>
  );
}

function UnavailablePost(props: { title: string }) {
  return (
    <div className="section-shell pb-20 pt-8">
      <GlassPanel className="p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--text)]">{props.title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Return to the blog to browse published updates.</p>
        <Button variant="brand" className="mt-6" asChild>
          <Link href={ROUTES.MARKETING.BLOGS}>Back to Blog</Link>
        </Button>
      </GlassPanel>
    </div>
  );
}
