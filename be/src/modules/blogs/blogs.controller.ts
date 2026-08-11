import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

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

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<BlogPostDto> {
    return this.blogsService.getPublicBySlug(slug);
  }
}
