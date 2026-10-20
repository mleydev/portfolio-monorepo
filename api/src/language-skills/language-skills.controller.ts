import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryLanguageSkillsDto } from './dto/query-language-skills.dto';
import { LanguageSkillsService } from './language-skills.service';

@ApiTags('Language Skills')
@Controller('language-skills')
export class LanguageSkillsController {
  constructor(private readonly languageSkillsService: LanguageSkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Get public language skills by language' })
  findPublic(@Query() query: QueryLanguageSkillsDto) {
    return this.languageSkillsService.findPublic(query);
  }
}
