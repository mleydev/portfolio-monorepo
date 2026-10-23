import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaAdminController } from './media.admin.controller';
import { MediaPublicController } from './media.public.controller';
import { MediaService } from './media.service';

@Module({
  imports: [AuthModule],
  controllers: [MediaAdminController, MediaPublicController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
