import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Language } from '../../generated/prisma/client';
import { SiteManagementService } from './site-management.service';

@ApiTags('Site Management')
@Controller('site')
export class SiteManagementController {
  constructor(private readonly siteManagementService: SiteManagementService) {}

  @Get('home-sections')
  findHomeSections(@Query('lang') lang: Language = Language.fa) {
    this.validateLanguage(lang);
    return this.siteManagementService.findPublicSections(lang);
  }

  @Get('settings')
  findPublicSettings(@Query('lang') lang: Language = Language.fa) {
    this.validateLanguage(lang);
    return this.siteManagementService.findPublicSettings(lang);
  }

  private validateLanguage(lang: Language) {
    if (!Object.values(Language).includes(lang)) {
      throw new BadRequestException('Unsupported language.');
    }
  }
}
