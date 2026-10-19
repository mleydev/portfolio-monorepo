import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class NavigationItemOrderDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderNavigationItemsDto {
  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: NavigationItemOrderDto) => item.key)
  @ValidateNested({ each: true })
  @Type(() => NavigationItemOrderDto)
  items!: NavigationItemOrderDto[];
}
