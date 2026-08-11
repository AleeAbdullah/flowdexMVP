import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import sanitizeHtml = require('sanitize-html');
import { Repository } from 'typeorm';

import { CreateBlogPostDto, UpdateBlogPostDto, type BlogPostDto, type BlogPostSummaryDto } from './dto/blogs.dto';
import { BlogPostEntity } from './entities/blog-post.entity';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'h2', 'h3', 'strong', 'em', 'u', 's', 'strike', 'mark',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'a',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
};

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostsRepository: Repository<BlogPostEntity>,
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
    const post = this.blogPostsRepository.create({
      title: input.title,
      summary: input.summary,
      category: input.category,
      bodyHtml: this.sanitizeBody(input.bodyHtml),
      slug: await this.createUniqueSlug(input.title),
      createdByAdminId: adminUserId,
    });

    return this.toDto(await this.blogPostsRepository.save(post));
  }

  async update(id: string, input: UpdateBlogPostDto): Promise<BlogPostDto> {
    const post = this.requirePost(await this.blogPostsRepository.findOne({ where: { id } }));

    if (input.title !== undefined) post.title = input.title;
    if (input.summary !== undefined) post.summary = input.summary;
    if (input.category !== undefined) post.category = input.category;
    if (input.bodyHtml !== undefined) post.bodyHtml = this.sanitizeBody(input.bodyHtml);

    return this.toDto(await this.blogPostsRepository.save(post));
  }

  async delete(id: string): Promise<void> {
    const result = await this.blogPostsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Blog post not found');
    }
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

  private async createUniqueSlug(title: string): Promise<string> {
    const normalized = title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 170) || `post-${randomUUID().slice(0, 8)}`;
    let slug = normalized;
    let suffix = 2;

    while (await this.blogPostsRepository.exists({ where: { slug } })) {
      slug = `${normalized.slice(0, 180 - String(suffix).length)}-${suffix}`;
      suffix += 1;
    }

    return slug;
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
