import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import sanitizeHtml = require('sanitize-html');
import { EntityManager, Repository } from 'typeorm';

import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  type BlogImageUploadDto,
  type BlogPostDto,
  type BlogPostSummaryDto,
} from './dto/blogs.dto';
import { BlogImageEntity } from './entities/blog-image.entity';
import { BlogPostEntity } from './entities/blog-post.entity';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BLOG_IMAGE_ID = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const BLOG_IMAGE_URL = new RegExp(`/blogs/images/(${BLOG_IMAGE_ID})$`, 'i');

type UploadedBlogImage = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'h2', 'h3', 'strong', 'em', 'u', 's', 'strike', 'mark',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'a', 'img',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
  exclusiveFilter: frame => frame.tag === 'img' && !BLOG_IMAGE_URL.test(frame.attribs.src ?? ''),
};

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostsRepository: Repository<BlogPostEntity>,
    @InjectRepository(BlogImageEntity)
    private readonly blogImagesRepository: Repository<BlogImageEntity>,
  ) {}

  async listPublic(): Promise<{ items: BlogPostSummaryDto[] }> {
    const posts = await this.blogPostsRepository.find({
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
    });

    return { items: posts.map(post => this.toSummary(post)) };
  }

  async getPublicBySlug(slug: string): Promise<BlogPostDto> {
    const post = await this.blogPostsRepository.findOne({ where: { slug } });
    return this.toDto(this.requirePost(post));
  }

  async listAdmin(): Promise<{ items: BlogPostDto[] }> {
    const posts = await this.blogPostsRepository.find({
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
    });

    return { items: posts.map(post => this.toDto(post)) };
  }

  async create(input: CreateBlogPostDto, adminUserId: string): Promise<BlogPostDto> {
    const bodyHtml = this.sanitizeBody(input.bodyHtml);

    return this.blogPostsRepository.manager.transaction(async manager => {
      const repository = manager.getRepository(BlogPostEntity);
      const post = repository.create({
        title: input.title,
        summary: input.summary,
        category: input.category,
        bodyHtml,
        slug: await this.createUniqueSlug(input.title, repository),
        createdByAdminId: adminUserId,
      });
      const saved = await repository.save(post);
      await this.syncImages(manager, saved.id, bodyHtml);
      return this.toDto(saved);
    });
  }

  async update(id: string, input: UpdateBlogPostDto): Promise<BlogPostDto> {
    return this.blogPostsRepository.manager.transaction(async manager => {
      const repository = manager.getRepository(BlogPostEntity);
      const post = this.requirePost(await repository.findOne({ where: { id } }));

      if (input.title !== undefined) post.title = input.title;
      if (input.summary !== undefined) post.summary = input.summary;
      if (input.category !== undefined) post.category = input.category;
      if (input.bodyHtml !== undefined) post.bodyHtml = this.sanitizeBody(input.bodyHtml);

      const saved = await repository.save(post);
      await this.syncImages(manager, saved.id, saved.bodyHtml);
      return this.toDto(saved);
    });
  }

  async delete(id: string): Promise<void> {
    const result = await this.blogPostsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Blog post not found');
    }
  }

  async uploadImage(file: UploadedBlogImage | undefined, adminUserId: string): Promise<BlogImageUploadDto> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Choose an image to upload');
    }
    if (file.buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }

    const mimeType = this.detectImageMimeType(file.buffer);
    if (!mimeType || mimeType !== file.mimetype) {
      throw new BadRequestException('Image content must be JPEG, PNG, GIF, or WebP');
    }

    // ponytail: upload-triggered cleanup is enough for a small blog; add a scheduled job if uploads become infrequent and storage growth matters.
    await this.blogImagesRepository.createQueryBuilder()
      .delete()
      .where('blog_post_id IS NULL')
      .andWhere("created_at < now() - interval '24 hours'")
      .execute();

    const image = await this.blogImagesRepository.save(this.blogImagesRepository.create({
      data: file.buffer,
      mimeType,
      byteSize: file.buffer.length,
      createdByAdminId: adminUserId,
      blogPostId: null,
    }));

    return { id: image.id };
  }

  async getImage(id: string): Promise<Pick<BlogImageEntity, 'data' | 'mimeType' | 'byteSize'>> {
    const image = await this.blogImagesRepository.findOne({
      select: { data: true, mimeType: true, byteSize: true },
      where: { id },
    });
    if (!image) {
      throw new NotFoundException('Blog image not found');
    }
    return image;
  }

  private sanitizeBody(value: string): string {
    const sanitized = sanitizeHtml(value, SANITIZE_OPTIONS).trim();
    const plainText = sanitizeHtml(sanitized, { allowedTags: [], allowedAttributes: {} })
      .replace(/&nbsp;/gi, ' ')
      .trim();

    if (!plainText) {
      throw new BadRequestException('Blog body cannot be empty');
    }

    return sanitized;
  }

  private async createUniqueSlug(
    title: string,
    repository: Repository<BlogPostEntity> = this.blogPostsRepository,
  ): Promise<string> {
    const normalized = title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 170) || `post-${randomUUID().slice(0, 8)}`;
    let slug = normalized;
    let suffix = 2;

    while (await repository.exists({ where: { slug } })) {
      slug = `${normalized.slice(0, 180 - String(suffix).length)}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private detectImageMimeType(data: Buffer): string | null {
    if (data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
    if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
    if (data.subarray(0, 6).toString('ascii') === 'GIF87a' || data.subarray(0, 6).toString('ascii') === 'GIF89a') return 'image/gif';
    if (data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
    return null;
  }

  private async syncImages(manager: EntityManager, blogPostId: string, bodyHtml: string): Promise<void> {
    const repository = manager.getRepository(BlogImageEntity);
    const imageIds = [...new Set(this.extractImageSources(bodyHtml)
      .map(source => source.match(BLOG_IMAGE_URL)?.[1])
      .filter((id): id is string => Boolean(id)))];
    const images = imageIds.length
      ? await repository.createQueryBuilder('image').where('image.id IN (:...imageIds)', { imageIds }).getMany()
      : [];

    if (images.length !== imageIds.length || images.some(image => image.blogPostId && image.blogPostId !== blogPostId)) {
      throw new BadRequestException('Blog article contains an unavailable image');
    }

    const deleteQuery = repository.createQueryBuilder()
      .delete()
      .where('blog_post_id = :blogPostId', { blogPostId });
    if (imageIds.length) {
      deleteQuery.andWhere('id NOT IN (:...imageIds)', { imageIds });
    }
    await deleteQuery.execute();

    if (imageIds.length) {
      await repository.createQueryBuilder()
        .update()
        .set({ blogPostId })
        .where('id IN (:...imageIds)', { imageIds })
        .execute();
    }
  }

  private extractImageSources(bodyHtml: string): string[] {
    return [...bodyHtml.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map(match => match[1]);
  }

  private requirePost(post: BlogPostEntity | null): BlogPostEntity {
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }
    return post;
  }

  private toSummary(post: BlogPostEntity): BlogPostSummaryDto {
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      category: post.category,
      publishedAt: post.publishedAt.toISOString(),
      coverImageUrl: this.extractImageSources(post.bodyHtml)[0] ?? null,
    };
  }

  private toDto(post: BlogPostEntity): BlogPostDto {
    return {
      ...this.toSummary(post),
      bodyHtml: post.bodyHtml,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
