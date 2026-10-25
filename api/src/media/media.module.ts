import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaAdminController } from './media.admin.controller';
import { MediaPublicController } from './media.public.controller';
import { MediaService } from './media.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]), AuthModule],
  controllers: [MediaAdminController, MediaPublicController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
