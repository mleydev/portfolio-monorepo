import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SiteManagementService } from './site-management.service';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { ReorderHomeSectionsDto } from './dto/reorder-home-sections.dto';

@ApiTags('Admin Site Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/home-sections')
export class SiteManagementAdminController {
  constructor(private readonly siteManagementService: SiteManagementService) {}

  @Get()
  findAll() {
    return this.siteManagementService.findAllAdmin();
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderHomeSectionsDto) {
    return this.siteManagementService.reorderSections(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHomeSectionDto) {
    return this.siteManagementService.updateSection(id, dto);
  }
}
