import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Language, PollStatus } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollStatusDto } from './dto/update-poll-status.dto';
import { PollsService } from './polls.service';

@ApiTags('Admin Polls')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/polls')
export class PollsAdminController {
  constructor(private readonly pollsService: PollsService) {}

  @Get()
  findAll() {
    return this.pollsService.findAllAdmin();
  }

  @Get(':id/results')
  getResults(
    @Param('id') id: string,
    @Query('lang') language: Language = Language.fa,
  ) {
    return this.pollsService.getAdminResults(id, language);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pollsService.findOneAdmin(id);
  }

  @Post()
  create(@Body() dto: CreatePollDto) {
    return this.pollsService.create(dto);
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: UpdatePollStatusDto) {
    return this.pollsService.setStatus(id, dto.status as PollStatus);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pollsService.remove(id);
  }
}
