import { Controller, Get, Param, ParseUUIDPipe, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { BlogsService } from './blogs.service';
import type { BlogPostDto, BlogPostSummaryDto } from './dto/blogs.dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  list(): Promise<{ items: BlogPostSummaryDto[] }> {
    return this.blogsService.listPublic();
  }

  @Get('images/:id')
  async getImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.blogsService.getImage(id);
    response.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(image.byteSize),
      'Content-Type': image.mimeType,
      ETag: `"${id}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(image.data);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<BlogPostDto> {
    return this.blogsService.getPublicBySlug(slug);
  }
}
