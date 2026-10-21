import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Language } from '../../generated/prisma/client';
import { SiteManagementService } from './site-management.service';

@ApiTags('Site Management')
@Controller('site')
export class SiteManagementController {
  constructor(private readonly siteManagementService: SiteManagementService) {}

  @Get('home-sections')
  findHomeSections(@Query('lang') lang: Language = Language.fa) {
    return this.siteManagementService.findPublicSections(lang);
  }
}
