import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './projects.controller';
import { ProjectsAdminController } from './projects.admin.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, ProjectsAdminController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
