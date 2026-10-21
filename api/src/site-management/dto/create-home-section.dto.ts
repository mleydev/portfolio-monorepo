import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from 'generated/prisma/enums';

class HomeSectionTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}

export class CreateHomeSectionDto {
  @IsString()
  key: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeSectionTranslationDto)
  translations: HomeSectionTranslationDto[];
}
