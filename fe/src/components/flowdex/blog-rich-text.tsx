'use client';

import Placeholder from '@tiptap/extension-placeholder';
import { mergeAttributes, Node } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { Bold, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Quote, Redo, Strikethrough, Underline, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';

const BlogImage = Node.create({
  name: 'blogImage',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes: () => ({
    src: { default: null },
    alt: { default: '' },
    title: { default: null },
  }),
  parseHTML: () => [{ tag: 'img[src]' }],
  renderHTML: ({ HTMLAttributes }) => ['img', mergeAttributes(HTMLAttributes)],
});

const getExtensions = (editable: boolean) => [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: !editable },
  }),
  BlogImage,
  Placeholder.configure({ placeholder: 'Write the blog post…' }),
];

export function BlogRichText(props: {
  content: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  className?: string;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const editable = props.editable ?? false;
  const imageInput = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const editor = useEditor({
    extensions: getExtensions(editable),
    content: props.content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-label': editable ? 'Blog article editor' : 'Blog article',
      },
    },
    onUpdate: ({ editor: currentEditor }) => props.onChange?.(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && props.content !== editor.getHTML()) {
      editor.commands.setContent(props.content || '');
    }
  }, [editor, props.content]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) {
    return <div className={cn('min-h-52 animate-pulse rounded-xl bg-[var(--card-bg)]', props.className)} />;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl ?? 'https://');
    if (url === null) {
      return;
    }
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const uploadImage = async (file: File) => {
    if (!props.onUploadImage) {
      return;
    }
    const defaultAlt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    const alt = window.prompt('Describe this image for screen readers', defaultAlt);
    if (alt === null) {
      return;
    }

    setIsUploadingImage(true);
    try {
      const src = await props.onUploadImage(file);
      editor.chain().focus().insertContent({
        type: 'blogImage',
        attrs: { src, alt: alt.trim() },
      }).run();
    } catch {
      // The upload mutation shows the API error.
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className={cn(
      'overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]',
      props.className,
    )}
    >
      {editable ? (
        <div className="flex flex-wrap gap-1 border-b border-[var(--card-border)] p-2" role="toolbar" aria-label="Blog formatting">
          <EditorButton label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo /></EditorButton>
          <EditorButton label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo /></EditorButton>
          <EditorButton label="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</EditorButton>
          <EditorButton label="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</EditorButton>
          <EditorButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></EditorButton>
          <EditorButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></EditorButton>
          <EditorButton label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></EditorButton>
          <EditorButton label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></EditorButton>
          <EditorButton label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></EditorButton>
          <EditorButton label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></EditorButton>
          <EditorButton label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></EditorButton>
          <EditorButton label="Link" onClick={setLink}><LinkIcon /></EditorButton>
          {props.onUploadImage ? (
            <>
              <EditorButton
                label={isUploadingImage ? 'Uploading image' : 'Add image'}
                onClick={() => imageInput.current?.click()}
                disabled={isUploadingImage}
              >
                <ImagePlus />
              </EditorButton>
              <input
                ref={imageInput}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                onChange={event => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) {
                    void uploadImage(file);
                  }
                }}
              />
            </>
          ) : null}
        </div>
      ) : null}
      <EditorContent
        editor={editor}
        className={cn(
          'text-sm leading-8 text-[var(--muted)] [&_.tiptap]:min-h-52 [&_.tiptap]:px-5 [&_.tiptap]:py-5 [&_.tiptap]:focus-visible:ring-2 [&_.tiptap]:focus-visible:ring-inset [&_.tiptap]:focus-visible:ring-[var(--accent-strong)]',
          '[&_.tiptap_h2]:mb-3 [&_.tiptap_h2]:mt-8 [&_.tiptap_h2]:font-heading [&_.tiptap_h2]:text-2xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:text-[var(--text)]',
          '[&_.tiptap_h3]:mb-2 [&_.tiptap_h3]:mt-6 [&_.tiptap_h3]:text-xl [&_.tiptap_h3]:font-bold [&_.tiptap_h3]:text-[var(--text)]',
          '[&_.tiptap_p]:my-3 [&_.tiptap_ul]:my-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:my-3 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6',
          '[&_.tiptap_blockquote]:my-5 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[var(--accent-border)] [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:italic',
          '[&_.tiptap_pre]:my-5 [&_.tiptap_pre]:overflow-x-auto [&_.tiptap_pre]:rounded-lg [&_.tiptap_pre]:bg-[var(--bg)] [&_.tiptap_pre]:p-4',
          '[&_.tiptap_code]:rounded [&_.tiptap_code]:bg-[var(--bg)] [&_.tiptap_code]:px-1.5 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:font-data',
          '[&_.tiptap_a]:font-semibold [&_.tiptap_a]:text-[var(--accent-strong)] [&_.tiptap_a]:underline',
          '[&_.tiptap_img]:my-6 [&_.tiptap_img]:max-h-[36rem] [&_.tiptap_img]:w-full [&_.tiptap_img]:rounded-xl [&_.tiptap_img]:object-cover',
          '[&_.tiptap_.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_.is-editor-empty:first-child::before]:float-left [&_.tiptap_.is-editor-empty:first-child::before]:h-0 [&_.tiptap_.is-editor-empty:first-child::before]:text-[var(--muted)] [&_.tiptap_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
        )}
      />
    </div>
  );
}

function EditorButton(props: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      onClick={props.onClick}
      disabled={props.disabled}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold text-[var(--muted)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4"
    >
      {props.children}
    </button>
  );
}
