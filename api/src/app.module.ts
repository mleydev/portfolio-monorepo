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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ProjectsModule,
    NavigationModule,
    AuthModule,
    ProfileModule,
    SkillsModule,
    LanguageSkillsModule,
    ExperienceModule,
    BlogModule,
  ],
})
export class AppModule {}

