import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMyAvatarDto {
  @ApiProperty({
    description: 'ID of an uploaded IMAGE media record',
    example: 'cmvo8514i000044vdxv6mwjlz',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  mediaId!: string;
}
