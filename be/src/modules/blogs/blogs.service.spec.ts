import { BadRequestException } from '@nestjs/common';

import { BlogsService } from './blogs.service';
import { BlogImageEntity } from './entities/blog-image.entity';
import { BlogPostEntity } from './entities/blog-post.entity';

const imageId = '123e4567-e89b-42d3-a456-426614174000';

function queryBuilder(extra: Record<string, unknown> = {}) {
  return {
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
    ...extra,
  };
}

describe('BlogsService images', () => {
  it('stores a valid image and rejects a spoofed MIME type', async () => {
    const cleanup = queryBuilder();
    const imageRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(cleanup),
      create: jest.fn(value => value),
      save: jest.fn(async value => ({ ...value, id: imageId })),
    };
    const service = new BlogsService({} as never, imageRepository as never);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    await expect(service.uploadImage({ buffer: png, mimetype: 'image/png', size: png.length }, 'admin'))
      .resolves.toEqual({ id: imageId });
    await expect(service.uploadImage({ buffer: png, mimetype: 'image/jpeg', size: png.length }, 'admin'))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('associates inline images and returns the first one as the cover', async () => {
    const select = queryBuilder({
      getMany: jest.fn().mockResolvedValue([{ id: imageId, blogPostId: null }]),
    });
    const removeOld = queryBuilder();
    const associate = queryBuilder();
    const imageRepository = {
      createQueryBuilder: jest.fn()
        .mockReturnValueOnce(select)
        .mockReturnValueOnce(removeOld)
        .mockReturnValueOnce(associate),
    };
    const now = new Date('2026-08-11T00:00:00.000Z');
    const postRepository = {
      exists: jest.fn().mockResolvedValue(false),
      create: jest.fn(value => value),
      save: jest.fn(async value => ({
        ...value,
        id: '223e4567-e89b-42d3-a456-426614174000',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      })),
    };
    const manager = {
      getRepository: jest.fn(entity => entity === BlogPostEntity ? postRepository : imageRepository),
    };
    const blogRepository = {
      manager: { transaction: jest.fn(callback => callback(manager)) },
    };
    const service = new BlogsService(blogRepository as never, {} as never);
    const imageUrl = `https://api.flowdex.app/api/blogs/images/${imageId}`;

    const result = await service.create({
      title: 'Image post',
      summary: 'Summary',
      category: 'Product',
      bodyHtml: `<p>Hello</p><img src="${imageUrl}" alt="Chart">`,
    }, 'admin');

    expect(result.coverImageUrl).toBe(imageUrl);
    expect(associate.set).toHaveBeenCalledWith({ blogPostId: result.id });
    expect(manager.getRepository).toHaveBeenCalledWith(BlogImageEntity);
  });
});

describe('BlogsService slugs', () => {
  const now = new Date('2026-08-18T00:00:00.000Z');

  function createService(slugExists = false) {
    const removeOld = queryBuilder();
    const imageRepository = { createQueryBuilder: jest.fn().mockReturnValue(removeOld) };
    const postRepository = {
      exists: jest.fn().mockResolvedValue(slugExists),
      create: jest.fn(value => value),
      save: jest.fn(async value => ({
        ...value,
        id: '223e4567-e89b-42d3-a456-426614174000',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      })),
    };
    const manager = {
      getRepository: jest.fn(entity => entity === BlogPostEntity ? postRepository : imageRepository),
    };
    const blogRepository = {
      manager: { transaction: jest.fn(callback => callback(manager)) },
    };

    return new BlogsService(blogRepository as never, {} as never);
  }

  it('normalizes a custom slug', async () => {
    const result = await createService().create({
      title: 'Long article title',
      slug: '  Short Custom URL  ',
      summary: 'Summary',
      category: 'Product',
      bodyHtml: '<p>Hello</p>',
    }, 'admin');

    expect(result.slug).toBe('short-custom-url');
  });

  it('rejects a custom slug that is already used', async () => {
    await expect(createService(true).create({
      title: 'Another article',
      slug: 'existing-url',
      summary: 'Summary',
      category: 'Product',
      bodyHtml: '<p>Hello</p>',
    }, 'admin')).rejects.toThrow('That blog URL is already in use');
  });
});
