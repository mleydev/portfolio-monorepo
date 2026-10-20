import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BlogTagTranslationDto {
  @IsIn(['fa', 'en', 'tr', 'ar'])
  language: 'fa' | 'en' | 'tr' | 'ar';

  @IsString()
  name: string;

  @IsString()
  slug: string;
}

export class CreateBlogTagDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogTagTranslationDto)
  translations: BlogTagTranslationDto[];
}
