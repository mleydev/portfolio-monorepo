import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ExperienceService } from './experience.service';
import { QueryExperienceDto } from './dto/query-experience.dto';

@ApiTags('Experience')
@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Get()
  @ApiOperation({
    summary: 'Get experience entries',
    description:
      'Returns enabled experience entries with translations for the requested language.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['fa', 'en', 'tr', 'ar'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Experience entries retrieved successfully.',
  })
  findAll(@Query() query: QueryExperienceDto) {
    return this.experienceService.findAll(query);
  }
}
