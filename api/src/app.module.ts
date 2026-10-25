import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { NavigationModule } from './navigation/navigation.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { SkillsModule } from './skills/skills.module';
import { LanguageSkillsModule } from './language-skills/language-skills.module';
import { ExperienceModule } from './experience/experience.module';
import { BlogModule } from './blog/blog.module';
import { SiteManagementModule } from './site-management/site-management.module';
import { MediaModule } from './media/media.module';
import { PollsModule } from './polls/polls.module';
import { FeedbackModule } from './feedback/feedback.module';
import { PermissionsModule } from './auth/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    PermissionsModule,
    PrismaModule,
    ProjectsModule,
    NavigationModule,
    ProfileModule,
    SkillsModule,
    LanguageSkillsModule,
    ExperienceModule,
    BlogModule,
    SiteManagementModule,
    MediaModule,
    PollsModule,
    FeedbackModule,
  ],
})
export class AppModule {}
