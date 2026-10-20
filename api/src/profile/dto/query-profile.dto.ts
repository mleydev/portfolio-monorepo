import { IsEnum, IsOptional } from 'class-validator';
import { Language } from '../../../generated/prisma/client';

export class QueryProfileDto {
  @IsOptional()
  @IsEnum(Language)
  lang: Language = Language.fa;
}
