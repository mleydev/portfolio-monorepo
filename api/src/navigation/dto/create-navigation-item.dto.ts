import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '../../../generated/prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class NavigationItemTranslationDto {
  @ApiProperty()
  @IsEnum(Language)
  language!: Language;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;
}

export class CreateNavigationItemDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MinLength(2)
  @MaxLength(50)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  href!: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  external?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NavigationItemTranslationDto)
  translations!: NavigationItemTranslationDto[];
}
