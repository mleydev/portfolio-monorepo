import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PollsController } from './polls.controller';
import { PollsAdminController } from './polls.admin.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [AuthModule],
  controllers: [PollsController, PollsAdminController],
  providers: [PollsService],
})
export class PollsModule {}
