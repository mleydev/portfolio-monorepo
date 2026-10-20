
import { Controller, Get, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { QueryProjectsDto } from './dto/query-projects.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query() query: QueryProjectsDto) {
    return this.projectsService.findAll(query);
  }
}
