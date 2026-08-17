'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { API_ROUTES } from '@/api-routes';
import useAxiosAuth from '@/hooks/use-axiosAuth';
import { api, extractAxiosError } from '@/lib/axios';
import type {
  BlogPost,
  BlogImageUpload,
  BlogPostInput,
  BlogPostSummariesResponse,
  BlogPostsResponse,
} from './blogs.types';

export const blogQueryKeys = {
  publicList: ['blogs', 'public'] as const,
  publicDetail: (slug: string) => ['blogs', 'public', slug] as const,
  adminList: ['blogs', 'admin'] as const,
};

const MAX_BLOG_IMAGE_BYTES = 5 * 1024 * 1024;
const BLOG_IMAGE_UPLOAD_TIMEOUT_MS = 120_000;

const browserPublicProxyConfig = typeof window === 'undefined'
  ? undefined
  : process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true'
    ? undefined
    : { baseURL: API_ROUTES.proxy.publicBackend };

export function usePublicBlogPosts() {
  return useQuery({
    queryKey: blogQueryKeys.publicList,
    queryFn: () => api.get<BlogPostSummariesResponse>(
      API_ROUTES.public.blogs.root,
      browserPublicProxyConfig,
    ),
  });
}

export function usePublicBlogPost(slug: string) {
  return useQuery({
    queryKey: blogQueryKeys.publicDetail(slug),
    queryFn: () => api.get<BlogPost>(
      API_ROUTES.public.blogs.detail(slug),
      browserPublicProxyConfig,
    ),
    enabled: Boolean(slug),
    retry: false,
  });
}

export function useAdminBlogPosts(initialData?: BlogPostsResponse) {
  const client = useAxiosAuth();

  return useQuery({
    queryKey: blogQueryKeys.adminList,
    queryFn: async () => {
      const response = await client.get<BlogPostsResponse>(API_ROUTES.bff.admin.blogs.root);
      return response.data;
    },
    initialData,
  });
}

export function useCreateBlogPost() {
  const client = useAxiosAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BlogPostInput) => {
      const response = await client.post<BlogPost>(API_ROUTES.bff.admin.blogs.root, input);
      return response.data;
    },
    onSuccess: async () => {
      await invalidateBlogQueries(queryClient);
      toast.success('Blog post published');
    },
    onError: error => toast.error(extractAxiosError(error).message || 'Could not publish blog post'),
  });
}

export function useUpdateBlogPost() {
  const client = useAxiosAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BlogPostInput }) => {
      const response = await client.patch<BlogPost>(API_ROUTES.bff.admin.blogs.detail(id), input);
      return response.data;
    },
    onSuccess: async post => {
      await Promise.all([
        invalidateBlogQueries(queryClient),
        queryClient.invalidateQueries({ queryKey: blogQueryKeys.publicDetail(post.slug) }),
      ]);
      toast.success('Blog post updated');
    },
    onError: error => toast.error(extractAxiosError(error).message || 'Could not update blog post'),
  });
}

export function useDeleteBlogPost() {
  const client = useAxiosAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => client.delete(API_ROUTES.bff.admin.blogs.detail(id)),
    onSuccess: async () => {
      await invalidateBlogQueries(queryClient);
      toast.success('Blog post deleted');
    },
    onError: error => toast.error(extractAxiosError(error).message || 'Could not delete blog post'),
  });
}

export function useUploadBlogImage() {
  const client = useAxiosAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_BLOG_IMAGE_BYTES) {
        throw new Error('Image must be 5 MB or smaller');
      }
      const formData = new FormData();
      formData.append('image', file);
      const response = await client.post<BlogImageUpload>(API_ROUTES.bff.admin.blogs.images, formData, {
        headers: { 'Content-Type': undefined },
        timeout: BLOG_IMAGE_UPLOAD_TIMEOUT_MS,
      });
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
        ?? API_ROUTES.proxy.publicBackend;
      return `${apiBaseUrl}${API_ROUTES.public.blogs.image(response.data.id)}`;
    },
    onError: error => toast.error(extractAxiosError(error).message || 'Could not upload image'),
  });
}

function invalidateBlogQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: blogQueryKeys.adminList }),
    queryClient.invalidateQueries({ queryKey: blogQueryKeys.publicList }),
  ]);
}
