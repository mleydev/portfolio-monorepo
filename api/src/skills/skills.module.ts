import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SkillsController } from './skills.controller';
import { SkillsAdminController } from './skills.admin.controller';
import { SkillsService } from './skills.service';

@Module({
  imports: [AuthModule],
  controllers: [SkillsController, SkillsAdminController],
  providers: [SkillsService],
})
export class SkillsModule {}
