import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CEFRLevel, Language } from '../../../generated/prisma/client';

export class LanguageSkillTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class CreateLanguageSkillDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(CEFRLevel)
  level: CEFRLevel;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  proficiency: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LanguageSkillTranslationDto)
  translations: LanguageSkillTranslationDto[];
}
