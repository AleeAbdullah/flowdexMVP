export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
};

export type BlogPost = BlogPostSummary & {
  bodyHtml: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostInput = {
  title: string;
  summary: string;
  category: string;
  bodyHtml: string;
};

export type BlogPostSummariesResponse = {
  items: BlogPostSummary[];
};

export type BlogPostsResponse = {
  items: BlogPost[];
};
