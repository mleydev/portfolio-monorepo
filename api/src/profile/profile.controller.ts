import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { QueryProfileDto } from './dto/query-profile.dto';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the public profile in a selected language',
  })
  findPublic(@Query() query: QueryProfileDto) {
    return this.profileService.findPublic(query.lang);
  }
}
