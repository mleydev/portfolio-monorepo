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
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { SiteManagementService } from './site-management.service';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { ReorderHomeSectionsDto } from './dto/reorder-home-sections.dto';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpsertSiteSettingDto } from './dto/upsert-site-setting.dto';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdateSocialLinkDto } from './dto/update-social-link.dto';

@ApiTags('Admin Site Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('site-management')
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

  @Post('social-links')
  createSocialLink(@Body() dto: CreateSocialLinkDto) {
    return this.siteManagementService.createSocialLink(dto);
  }

  @Get('social-links')
  findAllSocialLinks() {
    return this.siteManagementService.findAllSocialLinksAdmin();
  }

  @Patch('social-links/:id')
  updateSocialLink(@Param('id') id: string, @Body() dto: UpdateSocialLinkDto) {
    return this.siteManagementService.updateSocialLink(id, dto);
  }

  @Delete('social-links/:id')
  deleteSocialLink(@Param('id') id: string) {
    return this.siteManagementService.deleteSocialLink(id);
  }
}
