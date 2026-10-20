import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const supportedLanguages = ['fa', 'en', 'tr', 'ar'];
const articleStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

export class BlogArticleTranslationDto {
  @IsIn(supportedLanguages)
  language: 'fa' | 'en' | 'tr' | 'ar';

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(200)
  slug: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsObject()
  content: Record<string, unknown>;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;
}

export class CreateBlogArticleDto {
  @IsOptional()
  @IsIn(articleStatuses)
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsString()
  coverMediaId?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogArticleTranslationDto)
  translations: BlogArticleTranslationDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
