import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Language } from '../../../generated/prisma/client';

export class CreateProfileTranslationDto {
  @IsEnum(Language)
  language!: Language;

  @IsString()
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @MaxLength(150)
  role!: string;

  @IsString()
  bio!: string;
}

export class CreateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsUrl()
  resumeUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProfileTranslationDto)
  translations!: CreateProfileTranslationDto[];
}
