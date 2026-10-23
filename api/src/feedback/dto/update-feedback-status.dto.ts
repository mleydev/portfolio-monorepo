import { IsEnum } from 'class-validator';
import { FeedbackStatus } from '../../../generated/prisma/client';

export class UpdateFeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}
