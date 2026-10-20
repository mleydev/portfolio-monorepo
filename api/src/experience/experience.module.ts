import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExperienceController } from './experience.controller';
import { ExperienceAdminController } from './experience.admin.controller';
import { ExperienceService } from './experience.service';
import { ExperienceAdminService } from './experience.admin.service';

@Module({
  imports: [AuthModule],
  controllers: [ExperienceController, ExperienceAdminController],
  providers: [ExperienceService, ExperienceAdminService],
})
export class ExperienceModule {}
