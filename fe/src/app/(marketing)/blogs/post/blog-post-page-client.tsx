'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BlogRichText } from '@/components/flowdex/blog-rich-text';
import { MarketingContentShell, MarketingPageHero } from '@/components/flowdex/marketing-content';
import { GlassPanel } from '@/components/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublicBlogPost } from '@/dal/app/blogs/blogs.services';
import { ArrowLeft } from '@/icons';
import { ROUTES } from '@/routes';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function BlogPostPageClient() {
  const slug = useSearchParams().get('slug')?.trim() ?? '';
  const query = usePublicBlogPost(slug);

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
          <Badge variant="brand" className="mb-4">{post.category}</Badge>
          <BlogRichText content={post.bodyHtml} />
        </div>
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
