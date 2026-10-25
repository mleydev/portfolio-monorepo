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

import {
  PollTranslationDto,
  PollOptionTranslationDto,
} from './create-poll.dto';

/** DTO for updating an existing poll option. */
export class UpdatePollOptionDto {
  // Existing option IDs preserve their associated votes.
  @IsOptional()
  @IsString()
  id?: string;

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

/** DTO for partially updating a poll and its translations/options. */
export class UpdatePollDto {
  @IsOptional()
  @IsEnum(PollType)
  type?: PollType;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PollTranslationDto)
  translations?: PollTranslationDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => UpdatePollOptionDto)
  options?: UpdatePollOptionDto[];
}
