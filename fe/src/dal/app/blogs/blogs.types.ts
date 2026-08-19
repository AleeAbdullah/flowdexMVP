export const DEFAULT_BLOG_AUTHOR_NAME = 'FlowDex Team';
export const DEFAULT_BLOG_AUTHOR_BIO = 'Product, research, security, and community updates from the team building FlowDex.';

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  coverImageUrl: string | null;
};

export type BlogPost = BlogPostSummary & {
  bodyHtml: string;
  authorName?: string;
  authorBio?: string;
  featuredImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostInput = {
  title: string;
  slug?: string;
  summary: string;
  category: string;
  bodyHtml: string;
  authorName: string;
  authorBio: string;
  featuredImageUrl?: string | null;
};

export type BlogPostSummariesResponse = {
  items: BlogPostSummary[];
};

export type BlogPostsResponse = {
  items: BlogPost[];
  categories: string[];
};

export type BlogImageUpload = {
  id: string;
};
