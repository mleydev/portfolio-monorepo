import { IsEnum, IsOptional } from 'class-validator';
import { Language } from '../../../generated/prisma/client';

export class QueryLanguageSkillsDto {
  @IsOptional()
  @IsEnum(Language)
  lang: Language = Language.fa;
}
