import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileAdminController } from './profile.admin.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController, ProfileAdminController],
  providers: [ProfileService],
})
export class ProfileModule {}
