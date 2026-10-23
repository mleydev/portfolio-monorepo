import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaPublicController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':storageKey')
  @ApiParam({ name: 'storageKey', type: String })
  async getFile(@Param('storageKey') storageKey: string, @Res() res: Response) {
    const { buffer, media } = await this.mediaService.readFile(storageKey);

    res.setHeader('Content-Type', media.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.send(buffer);
  }
}
