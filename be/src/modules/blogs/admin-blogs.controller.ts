import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/domain.enums';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from '../users/users.service';
import { BlogsService } from './blogs.service';
import { CreateBlogPostDto, UpdateBlogPostDto, type BlogImageUploadDto, type BlogPostDto } from './dto/blogs.dto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@ApiTags('admin blogs')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(InternalJwtGuard, RolesGuard)
@Controller('admin/blogs')
export class AdminBlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async list(@CurrentAuth() auth: AuthContext): Promise<{ items: BlogPostDto[] }> {
    await this.usersService.syncAndRequireActive(auth);
    return this.blogsService.listAdmin();
  }

  @Post()
  async create(
    @CurrentAuth() auth: AuthContext,
    @Body() input: CreateBlogPostDto,
  ): Promise<BlogPostDto> {
    await this.usersService.syncAndRequireActive(auth);
    return this.blogsService.create(input, auth.sub);
  }

  @Post('images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  async uploadImage(
    @CurrentAuth() auth: AuthContext,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number } | undefined,
  ): Promise<BlogImageUploadDto> {
    await this.usersService.syncAndRequireActive(auth);
    return this.blogsService.uploadImage(file, auth.sub);
  }

  @Patch(':id')
  async update(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateBlogPostDto,
  ): Promise<BlogPostDto> {
    await this.usersService.syncAndRequireActive(auth);
    return this.blogsService.update(id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.usersService.syncAndRequireActive(auth);
    await this.blogsService.delete(id);
  }
}
