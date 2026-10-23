import { IsEnum } from 'class-validator';
import { PollStatus } from '../../../generated/prisma/client';

export class UpdatePollStatusDto {
  @IsEnum(PollStatus)
  status: PollStatus;
}
