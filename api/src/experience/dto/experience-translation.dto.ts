import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Language } from '../../../generated/prisma/client';

export class ExperienceTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
