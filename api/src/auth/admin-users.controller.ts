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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnerGuard } from './guards/owner.guard';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminPermissionsDto } from './dto/update-admin-permissions.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';

@ApiTags('Admin User Management')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll() {
    return this.adminUsersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.create(dto);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateAdminPermissionsDto,
  ) {
    return this.adminUsersService.updatePermissions(id, dto.permissions);
  }

  @Patch(':id/status')
  setActive(@Param('id') id: string, @Body() dto: UpdateAdminStatusDto) {
    return this.adminUsersService.setActive(id, dto.active);
  }
}
