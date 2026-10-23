import { IsString, MaxLength } from 'class-validator';

export class ReplyFeedbackDto {
  @IsString()
  @MaxLength(10000)
  adminReply: string;
}
