import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { AdminBlogsController } from './admin-blogs.controller';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { BlogImageEntity } from './entities/blog-image.entity';
import { BlogPostEntity } from './entities/blog-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPostEntity, BlogImageEntity]), UsersModule],
  controllers: [BlogsController, AdminBlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
