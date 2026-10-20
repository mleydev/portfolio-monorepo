import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BlogCategoryTranslationDto {
  @IsIn(['fa', 'en', 'tr', 'ar'])
  language: 'fa' | 'en' | 'tr' | 'ar';

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateBlogCategoryDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogCategoryTranslationDto)
  translations: BlogCategoryTranslationDto[];
}
