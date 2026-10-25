import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { QueryNavigationDto } from './dto/query-navigation.dto';
import { NavigationService } from './navigation.service';
import { CreateNavigationItemDto } from './dto/create-navigation-item.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateNavigationMenuDto } from './dto/create-navigation-menu.dto';
import { UpdateNavigationMenuDto } from './dto/update-navigation-menu.dto';
import { UpdateNavigationItemDto } from './dto/update-navigation-item.dto';
import { ReorderNavigationItemsDto } from './dto/reorder-navigation-items.dto';

@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  // Add this decorator above each protected endpoint.
  // @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  findPublicMenu(@Query() query: QueryNavigationDto) {
    return this.navigationService.findPublicMenu(query.key, query.lang);
  }

  // Add this decorator above each protected endpoint.
  @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('admin')
  findAllMenus() {
    return this.navigationService.findAllMenus();
  }

  // Add this decorator above each protected endpoint.
  @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':key/items')
  createItem(@Param('key') key: string, @Body() dto: CreateNavigationItemDto) {
    return this.navigationService.createItem(key, dto);
  }

  @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('admin')
  createMenu(@Body() dto: CreateNavigationMenuDto) {
    return this.navigationService.createMenu(dto);
  }

  @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch('admin/:key')
  updateMenu(@Param('key') key: string, @Body() dto: UpdateNavigationMenuDto) {
    return this.navigationService.updateMenu(key, dto);
  }

  @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete('admin/:key')
  deleteMenu(@Param('key') key: string) {
    return this.navigationService.deleteMenu(key);
  }

  // Keep the specific reorder route before the parameterized item route.
  @Patch('admin/:menuKey/items/reorder')
  @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  reorderItems(
    @Param('menuKey') menuKey: string,
    @Body() dto: ReorderNavigationItemsDto,
  ) {
    return this.navigationService.reorderItems(menuKey, dto);
  }

  @Patch('admin/:menuKey/items/:itemKey')
  @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  updateItem(
    @Param('menuKey') menuKey: string,
    @Param('itemKey') itemKey: string,
    @Body() dto: UpdateNavigationItemDto,
  ) {
    return this.navigationService.updateItem(menuKey, itemKey, dto);
  }

  @RequirePermission('navigation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete('admin/:menuKey/items/:itemKey')
  async deleteItem(
    @Param('menuKey') menuKey: string,
    @Param('itemKey') itemKey: string,
  ) {
    return this.navigationService.deleteItem(menuKey, itemKey);
  }
}
