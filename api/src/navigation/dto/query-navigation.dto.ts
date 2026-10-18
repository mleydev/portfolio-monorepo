import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Language } from '../../../generated/prisma/client';

export class QueryNavigationDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(50)
  key = 'main';

  @IsOptional()
  @IsEnum(Language)
  lang: Language = Language.en;
}
