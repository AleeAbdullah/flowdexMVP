'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { BlogCardThumbnail } from '@/components/flowdex/blog-card-thumbnail';
import { BlogRichText } from '@/components/flowdex/blog-rich-text';
import { SectionHeading } from '@/components/flowdex/primitives';
import { formatDateTime } from '@/components/flowdex/utils';
import { GlassPanel } from '@/components/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  useAdminBlogPosts,
  useCreateBlogCategory,
  useCreateBlogPost,
  useDeleteBlogCategory,
  useDeleteBlogPost,
  useUploadBlogImage,
  useUpdateBlogPost,
} from '@/dal/app/blogs/blogs.services';
import { DEFAULT_BLOG_AUTHOR_BIO, DEFAULT_BLOG_AUTHOR_NAME, type BlogPost, type BlogPostInput, type BlogPostsResponse } from '@/dal/app/blogs/blogs.types';
import { ArrowRight } from '@/icons';
import { ROUTES } from '@/routes';

const EMPTY_FORM: BlogPostInput = {
  title: '',
  slug: '',
  summary: '',
  category: '',
  bodyHtml: '',
  authorName: DEFAULT_BLOG_AUTHOR_NAME,
  authorBio: DEFAULT_BLOG_AUTHOR_BIO,
  featuredImageUrl: null,
};

export function AdminBlogsPageClient(props: {
  initialData: BlogPostsResponse;
}) {
  const query = useAdminBlogPosts(props.initialData);
  const createCategory = useCreateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const uploadImage = useUploadBlogImage();
  const featuredImageInput = useRef<HTMLInputElement>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogPostInput>(EMPTY_FORM);
  const [showEditor, setShowEditor] = useState(false);
  const isSaving = createPost.isPending || updatePost.isPending || uploadImage.isPending;
  const bodyText = form.bodyHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
  const isValid = Boolean(form.title.trim() && form.summary.trim() && form.category.trim() && form.authorName.trim() && form.authorBio.trim() && bodyText);

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
      slug: post.slug,
      summary: post.summary,
      category: post.category,
      bodyHtml: post.bodyHtml,
      authorName: post.authorName?.trim() || DEFAULT_BLOG_AUTHOR_NAME,
      authorBio: post.authorBio?.trim() || DEFAULT_BLOG_AUTHOR_BIO,
      featuredImageUrl: post.featuredImageUrl,
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
      ...(form.slug?.trim() ? { slug: form.slug.trim() } : {}),
      summary: form.summary.trim(),
      category: form.category.trim(),
      bodyHtml: form.bodyHtml,
      authorName: form.authorName.trim(),
      authorBio: form.authorBio.trim(),
      featuredImageUrl: form.featuredImageUrl ?? null,
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

  const handleFeaturedImage = async (file: File) => {
    try {
      const featuredImageUrl = await uploadImage.mutateAsync(file);
      setForm(current => ({ ...current, featuredImageUrl }));
    } catch {
      // Mutation hook surfaces the API message as a toast.
    }
  };

  const posts = query.data?.items ?? [];
  const categories = query.data?.categories ?? [];

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
                <p className="mt-1 text-sm text-[var(--muted)]">Title, category, summary, and article are required.</p>
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
                <CategoryCombobox
                  id="blog-category"
                  value={form.category}
                  categories={categories}
                  onChange={category => setForm(current => ({ ...current, category }))}
                  onCreate={createCategory.mutateAsync}
                  onDelete={deleteCategory.mutateAsync}
                  isCreating={createCategory.isPending}
                  deletingCategory={deleteCategory.isPending ? deleteCategory.variables : undefined}
                  disabled={isSaving}
                />
              </Field>
            </div>

            <Field label="URL" htmlFor="blog-slug">
              <div className="flex overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--bg-2)] focus-within:ring-2 focus-within:ring-[var(--cyan)]">
                <span className="flex items-center border-r border-[var(--card-border)] px-3 text-sm text-[var(--muted)]">/blogs/</span>
                <Input
                  id="blog-slug"
                  value={form.slug ?? ''}
                  maxLength={190}
                  onChange={event => setForm(current => ({ ...current, slug: event.target.value }))}
                  placeholder="generated-from-title"
                  disabled={isSaving}
                  className="border-0 bg-transparent focus-visible:ring-0"
                />
              </div>
              <p className="text-xs text-[var(--muted)]">Leave blank to generate the URL from the title.</p>
            </Field>

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

            <Field label="Featured image">
              <p className="text-xs text-[var(--muted)]">
                Optional. Shown on blog and related-post cards; otherwise the first article image is used.
              </p>
              {form.featuredImageUrl ? (
                <div className="max-w-xl overflow-hidden rounded-xl border border-[var(--card-border)]">
                  <BlogCardThumbnail src={form.featuredImageUrl} />
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="glass"
                  onClick={() => featuredImageInput.current?.click()}
                  disabled={isSaving}
                >
                  {uploadImage.isPending ? 'Uploading…' : form.featuredImageUrl ? 'Replace image' : 'Upload image'}
                </Button>
                {form.featuredImageUrl ? (
                  <Button
                    type="button"
                    variant="glass"
                    onClick={() => setForm(current => ({ ...current, featuredImageUrl: null }))}
                    disabled={isSaving}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <input
                ref={featuredImageInput}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                aria-label="Upload featured image"
                disabled={isSaving}
                onChange={event => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) {
                    void handleFeaturedImage(file);
                  }
                }}
              />
            </Field>

            <Field label="Article">
              <BlogRichText
                content={form.bodyHtml}
                onChange={bodyHtml => setForm(current => ({ ...current, bodyHtml }))}
                onUploadImage={file => uploadImage.mutateAsync(file)}
                editable={!isSaving}
              />
            </Field>

            <Field label="Author name" htmlFor="blog-author-name">
              <Input
                id="blog-author-name"
                value={form.authorName}
                maxLength={100}
                onChange={event => setForm(current => ({ ...current, authorName: event.target.value }))}
                placeholder="FlowDex Team"
                disabled={isSaving}
                required
              />
            </Field>

            <Field label="Author bio" htmlFor="blog-author-bio">
              <textarea
                id="blog-author-bio"
                value={form.authorBio}
                maxLength={500}
                onChange={event => setForm(current => ({ ...current, authorBio: event.target.value }))}
                placeholder="Short author biography shown below the article"
                disabled={isSaving}
                required
                rows={3}
                className="w-full resize-y rounded-lg border border-[var(--card-border)] bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--cyan)] disabled:opacity-50"
              />
              <p className="text-xs text-[var(--muted)]">Shown in the “Written by” card below the article.</p>
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
          <GlassPanel className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <caption className="sr-only">Published blog posts</caption>
                <thead className="border-b border-[var(--card-border)] bg-[var(--accent-bg)]">
                  <tr>
                    <th scope="col" className="px-5 py-4 text-xs font-bold tracking-wider text-[var(--muted)] uppercase">Post</th>
                    <th scope="col" className="px-5 py-4 text-xs font-bold tracking-wider text-[var(--muted)] uppercase">Category</th>
                    <th scope="col" className="px-5 py-4 text-xs font-bold tracking-wider text-[var(--muted)] uppercase">Published</th>
                    <th scope="col" className="px-5 py-4 text-right text-xs font-bold tracking-wider text-[var(--muted)] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {posts.map(post => (
                    <tr key={post.id} className="align-middle hover:bg-[var(--accent-bg)]">
                      <td className="min-w-72 px-5 py-4">
                        <div className="font-semibold text-[var(--text)]">{post.title}</div>
                        <div className="mt-1 max-w-xl truncate text-xs text-[var(--muted)]">/blogs/{post.slug}</div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4"><Badge variant="brand">{post.category}</Badge></td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--muted)]">{formatDateTime(post.publishedAt)}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex justify-end gap-2">
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
                            <Link href={ROUTES.MARKETING.blogPost(post.slug)} target="_blank" rel="noreferrer" aria-label={`View ${post.title}`}>
                              View
                              <ArrowRight aria-hidden className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        )}
      </section>
    </>
  );
}

function CategoryCombobox(props: {
  id: string;
  value: string;
  categories: string[];
  onChange: (category: string) => void;
  onCreate: (category: string) => Promise<unknown>;
  onDelete: (category: string) => Promise<unknown>;
  isCreating?: boolean;
  deletingCategory?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const query = search.trim();
  const normalizedQuery = query.toLocaleLowerCase();
  const matches = props.categories
    .filter(category => category.toLocaleLowerCase().includes(normalizedQuery))
    .slice(0, 5);
  const canCreate = query.length > 0
    && !props.categories.some(category => category.toLocaleLowerCase() === normalizedQuery);

  const select = (category: string) => {
    props.onChange(category);
    setOpen(false);
    setSearch('');
  };

  const create = async (category: string) => {
    try {
      await props.onCreate(category);
      select(category);
    } catch {
      // Mutation hook surfaces the API message as a toast.
    }
  };

  const remove = async (category: string) => {
    try {
      await props.onDelete(category);
      if (props.value === category) {
        props.onChange('');
      }
    } catch {
      // Mutation hook surfaces the API message as a toast.
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearch('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={props.id}
          type="button"
          variant="glass"
          role="combobox"
          aria-expanded={open}
          aria-label="Category"
          disabled={props.disabled}
          className="w-full justify-between px-3 font-normal"
        >
          <span className={props.value ? 'text-[var(--text)]' : 'text-[var(--muted)]'}>
            {props.value || 'Select a category'}
          </span>
          <ChevronDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] border-[var(--card-border)] bg-[var(--surface-elevated)] p-0 text-[var(--text)]"
      >
        <Command shouldFilter={false} className="bg-transparent text-[var(--text)]">
          <CommandInput
            value={search}
            onValueChange={setSearch}
            maxLength={60}
            placeholder="Search categories…"
            className="text-[var(--text)] placeholder:text-[var(--muted)]"
          />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup heading={query ? 'Results' : 'Recent categories'}>
              {matches.map(category => (
                <div key={category} className="flex items-center gap-1">
                  <CommandItem
                    value={category}
                    onSelect={() => select(category)}
                    className="flex-1 text-[var(--text)] data-[selected=true]:bg-[var(--accent-bg)]"
                  >
                    <Check className={props.value === category ? 'opacity-100' : 'opacity-0'} aria-hidden />
                    {category}
                  </CommandItem>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${category}`}
                    disabled={props.disabled || props.deletingCategory === category}
                    onClick={() => void remove(category)}
                    className="h-8 w-8 text-[var(--muted)] hover:text-[var(--status-error-text)]"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}
              {canCreate ? (
                <CommandItem
                  value={query}
                  onSelect={() => void create(query)}
                  disabled={props.isCreating}
                  className="text-[var(--text)] data-[selected=true]:bg-[var(--accent-bg)]"
                >
                  <Plus aria-hidden />
                  {props.isCreating ? 'Adding…' : `Add “${query}”`}
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
