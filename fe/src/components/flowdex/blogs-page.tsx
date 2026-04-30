import { MarketingContentShell, MarketingCtaBand, MarketingPageHero, UpdateCard } from './marketing-content';
import { marketingBlogPosts } from './marketing-data';

export function BlogsPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Blogs"
        title="Public updates, launch notes, and product progress in one route."
        description="For this pass, blogs and updates are merged into one public destination. It acts as the content index for progress, architecture notes, presale momentum, and public-facing release signals."
        meta={[
          { label: 'Format', value: 'Static Route-Level Index' },
          { label: 'Content', value: 'Product • Presale • Architecture • Security' },
          { label: 'Publishing Model', value: 'Curated Local Content' },
          { label: 'Audience', value: 'Community and Prospective Buyers' },
        ]}
      />

      <MarketingContentShell>
        <div className="section-shell grid gap-5 md:grid-cols-2">
          {marketingBlogPosts.map(post => (
            <UpdateCard
              key={post.title}
              category={post.category}
              date={post.date}
              title={post.title}
              summary={post.summary}
            />
          ))}
        </div>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Read the public progress log, then move into the product-facing routes.',
          body: 'This route gives the site a real content surface without adding a CMS yet. The buy route remains the main public conversion point.',
          primary: { href: '/buy', label: 'Open Buy Page' },
          secondary: { href: '/whitepaper', label: 'Read Whitepaper' },
        }}
      />
    </div>
  );
}
