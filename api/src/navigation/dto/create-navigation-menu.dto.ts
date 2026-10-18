import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateNavigationMenuDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key can contain lowercase letters, numbers, and hyphens only.',
  })
  @MinLength(2)
  @MaxLength(50)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  location?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
