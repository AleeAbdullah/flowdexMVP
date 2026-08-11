'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { BlogRichText } from '@/components/flowdex/blog-rich-text';
import { SectionHeading } from '@/components/flowdex/primitives';
import { formatDateTime } from '@/components/flowdex/utils';
import { GlassPanel } from '@/components/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminBlogPosts,
  useCreateBlogPost,
  useDeleteBlogPost,
  useUpdateBlogPost,
} from '@/dal/app/blogs/blogs.services';
import type { BlogPost, BlogPostInput, BlogPostsResponse } from '@/dal/app/blogs/blogs.types';
import { ArrowRight } from '@/icons';
import { ROUTES } from '@/routes';

const EMPTY_FORM: BlogPostInput = {
  title: '',
  summary: '',
  category: '',
  bodyHtml: '',
};

export function AdminBlogsPageClient(props: {
  initialData: BlogPostsResponse;
}) {
  const query = useAdminBlogPosts(props.initialData);
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogPostInput>(EMPTY_FORM);
  const [showEditor, setShowEditor] = useState(false);
  const isSaving = createPost.isPending || updatePost.isPending;
  const bodyText = form.bodyHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
  const isValid = Boolean(form.title.trim() && form.summary.trim() && form.category.trim() && bodyText);

  const resetEditor = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setShowEditor(false);
  };

  const openCreate = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setShowEditor(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      summary: post.summary,
      category: post.category,
      bodyHtml: post.bodyHtml,
    });
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      return;
    }

    const input = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      category: form.category.trim(),
      bodyHtml: form.bodyHtml,
    };

    try {
      if (editingPost) {
        await updatePost.mutateAsync({ id: editingPost.id, input });
      } else {
        await createPost.mutateAsync(input);
      }
      resetEditor();
    } catch {
      // Mutation hooks surface the API message as a toast.
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) {
      return;
    }
    try {
      await deletePost.mutateAsync(post.id);
      if (editingPost?.id === post.id) {
        resetEditor();
      }
    } catch {
      // Mutation hook surfaces the API message as a toast.
    }
  };

  const posts = query.data?.items ?? [];

  return (
    <>
      <GlassPanel className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
        <SectionHeading
          as="h1"
          eyebrow="Admin Blog"
          title="Publish FlowDex updates."
          description="Create, edit, and remove public blog posts. New posts go live immediately."
        />
        <Button variant="brand" onClick={openCreate}>New post</Button>
      </GlassPanel>

      {showEditor ? (
        <GlassPanel className="p-6 lg:p-8">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">
                  {editingPost ? 'Edit post' : 'New post'}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">All fields are required.</p>
              </div>
              <Button type="button" variant="glass" onClick={resetEditor} disabled={isSaving}>Cancel</Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Title" htmlFor="blog-title">
                <Input
                  id="blog-title"
                  value={form.title}
                  maxLength={160}
                  onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                  placeholder="Post title"
                  disabled={isSaving}
                  required
                />
              </Field>
              <Field label="Category" htmlFor="blog-category">
                <Input
                  id="blog-category"
                  value={form.category}
                  maxLength={60}
                  onChange={event => setForm(current => ({ ...current, category: event.target.value }))}
                  placeholder="Product, Security, Community…"
                  disabled={isSaving}
                  required
                />
              </Field>
            </div>

            <Field label="Summary" htmlFor="blog-summary">
              <textarea
                id="blog-summary"
                value={form.summary}
                maxLength={500}
                onChange={event => setForm(current => ({ ...current, summary: event.target.value }))}
                placeholder="Short description shown on the blog index"
                disabled={isSaving}
                required
                rows={3}
                className="w-full resize-y rounded-lg border border-[var(--card-border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--cyan)] disabled:opacity-50"
              />
            </Field>

            <Field label="Article">
              <BlogRichText
                content={form.bodyHtml}
                onChange={bodyHtml => setForm(current => ({ ...current, bodyHtml }))}
                editable={!isSaving}
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" variant="brand" disabled={!isValid || isSaving}>
                {isSaving ? 'Saving…' : editingPost ? 'Save changes' : 'Publish post'}
              </Button>
            </div>
          </form>
        </GlassPanel>
      ) : null}

      <section className="space-y-4" aria-labelledby="published-posts-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 id="published-posts-heading" className="text-xl font-bold text-[var(--text)]">Published posts</h2>
          <span className="text-sm text-[var(--muted)]">{posts.length}</span>
        </div>

        {query.isError ? (
          <GlassPanel className="p-6 text-sm text-[var(--status-error-text)]">Could not load blog posts.</GlassPanel>
        ) : posts.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <div className="text-lg font-bold text-[var(--text)]">No posts yet</div>
            <p className="mt-2 text-sm text-[var(--muted)]">Create the first post when you are ready to publish.</p>
          </GlassPanel>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.map(post => (
              <GlassPanel key={post.id} className="flex h-full flex-col p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="brand">{post.category}</Badge>
                  <span className="text-xs text-[var(--muted)]">{formatDateTime(post.publishedAt)}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-[var(--text)]">{post.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[var(--muted)]">{post.summary}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button type="button" variant="glass" size="sm" onClick={() => openEdit(post)}>Edit</Button>
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={() => handleDelete(post)}
                    disabled={deletePost.isPending}
                    className="hover:border-[var(--status-error-border)] hover:text-[var(--status-error-text)]"
                  >
                    Delete
                  </Button>
                  <Button variant="glass" size="sm" asChild>
                    <Link href={ROUTES.MARKETING.blogPost(post.slug)} target="_blank" rel="noreferrer">
                      View
                      <ArrowRight aria-hidden className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Field(props: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block space-y-2">
      {props.htmlFor ? (
        <label htmlFor={props.htmlFor} className="block text-sm font-semibold text-[var(--text)]">{props.label}</label>
      ) : (
        <div className="text-sm font-semibold text-[var(--text)]">{props.label}</div>
      )}
      {props.children}
    </div>
  );
}
