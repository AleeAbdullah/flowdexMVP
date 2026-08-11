import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateBlogPostDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  summary!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100_000)
  bodyHtml!: string;
}

export class UpdateBlogPostDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100_000)
  bodyHtml?: string;
}

export type BlogPostSummaryDto = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  coverImageUrl: string | null;
};

export type BlogPostDto = BlogPostSummaryDto & {
  bodyHtml: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogImageUploadDto = {
  id: string;
};
