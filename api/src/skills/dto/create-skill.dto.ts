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
  ValidateNested,
} from 'class-validator';
import { Language } from '../../../generated/prisma/client';

export class CreateSkillTranslationDto {
  @IsEnum(Language)
  language!: Language;

  @IsString()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSkillDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  level?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSkillTranslationDto)
  translations!: CreateSkillTranslationDto[];
}
