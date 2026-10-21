import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SiteManagementService } from './site-management.service';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { ReorderHomeSectionsDto } from './dto/reorder-home-sections.dto';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpsertSiteSettingDto } from './dto/upsert-site-setting.dto';

@ApiTags('Admin Site Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class SiteManagementAdminController {
  constructor(private readonly siteManagementService: SiteManagementService) {}

  @Post('home-sections')
  createHomeSection(@Body() dto: CreateHomeSectionDto) {
    return this.siteManagementService.createSection(dto);
  }

  @Get('home-sections')
  findAllSections() {
    return this.siteManagementService.findAllAdmin();
  }

  @Patch('home-sections/reorder')
  reorderSections(@Body() dto: ReorderHomeSectionsDto) {
    return this.siteManagementService.reorderSections(dto);
  }

  @Patch('home-sections/:id')
  updateSection(@Param('id') id: string, @Body() dto: UpdateHomeSectionDto) {
    return this.siteManagementService.updateSection(id, dto);
  }

  @Get('site-settings')
  findAllSettings() {
    return this.siteManagementService.findAllSettingsAdmin();
  }

  @Patch('site-settings/:key')
  upsertSetting(@Param('key') key: string, @Body() dto: UpsertSiteSettingDto) {
    return this.siteManagementService.upsertSetting(key, dto);
  }
}
