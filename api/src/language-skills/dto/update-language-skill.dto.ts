import { PartialType } from '@nestjs/swagger';
import { CreateLanguageSkillDto } from './create-language-skill.dto';

export class UpdateLanguageSkillDto extends PartialType(CreateLanguageSkillDto) {}
