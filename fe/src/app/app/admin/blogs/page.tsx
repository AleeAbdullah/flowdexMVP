import { API_ROUTES } from '@/api-routes';
import type { BlogPostsResponse } from '@/dal/app/blogs/blogs.types';
import { backendFetchJson } from '@/lib/auth-server';
import { AdminBlogsPageClient } from './admin-blogs-page-client';

export default async function AdminBlogsRoute() {
  const initialData = await backendFetchJson<BlogPostsResponse>(API_ROUTES.backend.admin.blogs.root);
  return <AdminBlogsPageClient initialData={initialData} />;
}
