import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  DefaultValuePipe,
  ParseEnumPipe,
} from '@nestjs/common';
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

  @Post(':id/votes')
  @ApiOperation({ summary: 'Submit a poll vote' })
  vote(@Param('id') id: string, @Body() dto: VotePollDto) {
    return this.pollsService.vote(id, dto);
  }
}
