import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@ApiTags('Admin Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('projects')
@Controller('admin/projects')
export class ProjectsAdminController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAllAdmin();
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
