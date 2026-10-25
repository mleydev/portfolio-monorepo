import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Headers,
  Req,
  DefaultValuePipe,
  ParseEnumPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Language } from '../../generated/prisma/client';
import { PollsService } from './polls.service';
import { VotePollDto } from './dto/vote-poll.dto';

@ApiTags('Polls')
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get()
  @ApiOperation({ summary: 'Get published polls' })
  findPublic(
    @Query(
      'lang',
      new DefaultValuePipe(Language.fa),
      new ParseEnumPipe(Language),
    )
    language: Language,
  ) {
    return this.pollsService.findPublic(language);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get poll results' })
  getResults(
    @Param('id') id: string,
    @Query(
      'lang',
      new DefaultValuePipe(Language.fa),
      new ParseEnumPipe(Language),
    )
    language: Language,
  ) {
    return this.pollsService.getResults(id, language);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Submit a vote' })
  async vote(
    @Param('id') id: string,
    @Body() dto: VotePollDto,
    @Headers('x-voter-key') clientVoterKey: string | undefined,
    @Req() request: Request,
  ) {
    const voterKey = clientVoterKey?.trim() || request.ip || 'anonymous-device';

    return this.pollsService.vote(id, dto, voterKey);
  }
}
