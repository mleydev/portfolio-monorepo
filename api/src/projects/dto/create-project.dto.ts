import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const supportedLanguages = ['fa', 'en', 'tr', 'ar'];

export class CreateProjectTranslationDto {
  @IsIn(supportedLanguages)
  language: 'fa' | 'en' | 'tr' | 'ar';

  @IsString()
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}

export class CreateProjectDto {
  @IsString()
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @IsOptional()
  @IsUrl()
  repositoryUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectTranslationDto)
  translations: CreateProjectTranslationDto[];
}
