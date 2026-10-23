import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language, PollType } from '../../../generated/prisma/client';

export class PollTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}

export class PollOptionTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  @MaxLength(300)
  label: string;
}

export class CreatePollOptionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PollOptionTranslationDto)
  translations: PollOptionTranslationDto[];
}

export class CreatePollDto {
  @IsEnum(PollType)
  type: PollType;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PollTranslationDto)
  translations: PollTranslationDto[];

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreatePollOptionDto)
  options: CreatePollOptionDto[];
}
