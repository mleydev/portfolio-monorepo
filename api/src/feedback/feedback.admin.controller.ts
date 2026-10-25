import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards, ParseEnumPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeedbackStatus } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { FeedbackService } from './feedback.service';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';

@ApiTags('Admin Feedback')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('feedback')
@Controller('admin/feedback')
export class FeedbackAdminController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  findAll(
    @Query('status', new ParseEnumPipe(FeedbackStatus, { optional: true }))
    status?: FeedbackStatus,
  ) {
    return this.feedbackService.findAllAdmin(status);
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: UpdateFeedbackStatusDto) {
    return this.feedbackService.setStatus(id, dto.status);
  }

  @Patch(':id/reply')
  reply(@Param('id') id: string, @Body() dto: ReplyFeedbackDto) {
    return this.feedbackService.reply(id, dto.adminReply);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedbackService.remove(id);
  }
}
