import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LanguageSkillsController } from './language-skills.controller';
import { LanguageSkillsAdminController } from './language-skills.admin.controller';
import { LanguageSkillsService } from './language-skills.service';

@Module({
  imports: [AuthModule],
  controllers: [LanguageSkillsController, LanguageSkillsAdminController],
  providers: [LanguageSkillsService],
})
export class LanguageSkillsModule {}
