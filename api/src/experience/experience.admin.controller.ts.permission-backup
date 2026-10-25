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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { ExperienceAdminService } from './experience.admin.service';

@ApiTags('Admin Experience')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/experience')
export class ExperienceAdminController {
  constructor(
    private readonly experienceAdminService: ExperienceAdminService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all experiences for admin' })
  findAll() {
    return this.experienceAdminService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an experience by ID' })
  findOne(@Param('id') id: string) {
    return this.experienceAdminService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an experience' })
  create(@Body() dto: CreateExperienceDto) {
    return this.experienceAdminService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an experience and its translations' })
  update(@Param('id') id: string, @Body() dto: UpdateExperienceDto) {
    return this.experienceAdminService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an experience' })
  remove(@Param('id') id: string) {
    return this.experienceAdminService.remove(id);
  }
}
