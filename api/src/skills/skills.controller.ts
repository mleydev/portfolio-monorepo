import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuerySkillsDto } from './dto/query-skills.dto';
import { SkillsService } from './skills.service';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Get public skills by language and filters' })
  findPublic(@Query() query: QuerySkillsDto) {
    return this.skillsService.findPublic(query);
  }
}
