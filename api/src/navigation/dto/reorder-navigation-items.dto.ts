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
  @ApiProperty({
    description: 'Unique key of the navigation item',
    example: 'home',
  })
  @IsString()
  key!: string;

  @ApiProperty({
    description: 'New position of the navigation item',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  sortOrder!: number;
}

export class ReorderNavigationItemsDto {
  @ApiProperty({
    description: 'Navigation items and their new positions',
    type: [NavigationItemOrderDto],
    example: [
      { key: 'home', sortOrder: 1 },
      { key: 'about', sortOrder: 2 },
      { key: 'skills', sortOrder: 3 },
      { key: 'contact', sortOrder: 4 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: NavigationItemOrderDto) => item.key)
  @ValidateNested({ each: true })
  @Type(() => NavigationItemOrderDto)
  items!: NavigationItemOrderDto[];
}
