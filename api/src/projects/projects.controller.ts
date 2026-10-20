import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query() query: QueryProjectsDto) {
    return this.projectsService.findAll(query);
  }

  @ApiOperation({
    summary: 'Get project details by slug',
    description:
      'Returns a published project with its translation for the requested language.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Unique project slug',
    example: 'test-react-dashboard',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['fa', 'en', 'tr', 'ar'],
    example: 'en',
    description: 'Project translation language. Defaults to fa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Project found successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid language parameter.',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found for the requested language.',
  })
  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query() query: QueryProjectsDto) {
    return this.projectsService.findOneBySlug(slug, query.lang);
  }
}
