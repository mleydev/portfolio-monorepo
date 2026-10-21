import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SiteManagementAdminController } from './site-management.admin.controller';
import { SiteManagementController } from './site-management.controller';
import { SiteManagementService } from './site-management.service';

@Module({
  imports: [AuthModule],
  controllers: [SiteManagementAdminController, SiteManagementController],
  providers: [SiteManagementService],
})
export class SiteManagementModule {}
