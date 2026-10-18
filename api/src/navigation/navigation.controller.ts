import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Language } from '../../generated/prisma/client';
import { NavigationService } from './navigation.service';

@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get()
  findPublicMenu(@Query('key') key = 'main', @Query('lang') lang = 'en') {
    if (!Object.values(Language).includes(lang as Language)) {
      throw new BadRequestException('Language must be fa, en, or tr.');
    }

    return this.navigationService.findPublicMenu(key, lang as Language);
  }

  @Get('admin')
  findAllMenus() {
    return this.navigationService.findAllMenus();
  }
}
