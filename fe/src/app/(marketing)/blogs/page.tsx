import type { Metadata } from 'next';
import { BlogsPage } from '@/components/flowdex/blogs-page';

export const metadata: Metadata = {
  title: 'Blog | FlowDex',
  description: 'FlowDex product updates, research, security notes, and community news.',
};

export default function BlogsRoute() {
  return <BlogsPage />;
}
