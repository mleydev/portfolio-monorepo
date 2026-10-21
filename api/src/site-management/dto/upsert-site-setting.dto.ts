import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '../../../generated/prisma/client';

export class SiteSettingTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsObject()
  value: Record<string, unknown>;
}

export class UpsertSiteSettingDto {
  @IsOptional()
  @IsObject()
  value?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiteSettingTranslationDto)
  translations?: SiteSettingTranslationDto[];
}
