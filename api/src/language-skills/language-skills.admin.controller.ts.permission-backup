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
import { CreateLanguageSkillDto } from './dto/create-language-skill.dto';
import { UpdateLanguageSkillDto } from './dto/update-language-skill.dto';
import { LanguageSkillsService } from './language-skills.service';

@ApiTags('Admin Language Skills')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/language-skills')
export class LanguageSkillsAdminController {
  constructor(private readonly languageSkillsService: LanguageSkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all language skills for admin' })
  findAll() {
    return this.languageSkillsService.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a language skill by ID' })
  findOne(@Param('id') id: string) {
    return this.languageSkillsService.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a language skill' })
  create(@Body() dto: CreateLanguageSkillDto) {
    return this.languageSkillsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a language skill and its translations' })
  update(@Param('id') id: string, @Body() dto: UpdateLanguageSkillDto) {
    return this.languageSkillsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a language skill' })
  remove(@Param('id') id: string) {
    return this.languageSkillsService.remove(id);
  }
}
