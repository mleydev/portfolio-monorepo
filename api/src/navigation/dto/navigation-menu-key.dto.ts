import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class NavigationMenuKeyDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MinLength(2)
  @MaxLength(50)
  key!: string;
}
