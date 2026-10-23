import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, Prisma } from '../../generated/prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { PrismaService } from '../prisma/prisma.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<
  MediaType,
  { mime: string[]; extensions: string[] }
> = {
  IMAGE: {
    mime: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  VIDEO: {
    mime: ['video/mp4', 'video/webm'],
    extensions: ['.mp4', '.webm'],
  },
  DOCUMENT: {
    mime: ['application/pdf'],
    extensions: ['.pdf'],
  },
};

@Injectable()
export class MediaService {
  private readonly uploadDir = resolve(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {}

  async upload(file: Express.Multer.File, type: MediaType) {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    if (!Object.values(MediaType).includes(type)) {
      throw new BadRequestException('Unsupported media type.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Maximum file size is 10 MB.');
    }

    const detected = await fileTypeFromBuffer(file.buffer);
    const config = ALLOWED_TYPES[type];

    if (
      !detected ||
      !config.mime.includes(detected.mime) ||
      !config.extensions.includes(
        detected.ext.startsWith('.') ? detected.ext : `.${detected.ext}`,
      )
    ) {
      throw new BadRequestException(
        'File content does not match an allowed file type.',
      );
    }

    const safeOriginalName = basename(file.originalname).slice(0, 255);
    const storageKey = `${randomUUID()}.${detected.ext}`;
    const filePath = join(this.uploadDir, storageKey);

    await mkdir(this.uploadDir, { recursive: true });

    try {
      await writeFile(filePath, file.buffer, { flag: 'wx' });

      const dimensions =
        type === MediaType.IMAGE
          ? await this.getImageDimensions(file.buffer, detected.mime)
          : null;

      const media = await this.prisma.media.create({
        data: {
          type,
          url: `/api/v1/media/${storageKey}`,
          storageKey,
          originalName: safeOriginalName,
          mimeType: detected.mime,
          sizeBytes: BigInt(file.size),
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
        },
      });

      return {
        ...media,
        sizeBytes: media.sizeBytes?.toString() ?? null,
      };
    } catch (error) {
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }

  async findAll(type?: MediaType) {
    if (type && !Object.values(MediaType).includes(type)) {
      throw new BadRequestException('Unsupported media type.');
    }

    const items = await this.prisma.media.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      ...item,
      sizeBytes: item.sizeBytes?.toString() ?? null,
    }));
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) {
      throw new NotFoundException('Media not found.');
    }

    return {
      ...media,
      sizeBytes: media.sizeBytes?.toString() ?? null,
    };
  }

  async readFile(storageKey: string) {
    if (
      basename(storageKey) !== storageKey ||
      !/^[0-9a-f-]+\.(jpg|jpeg|png|webp|gif|mp4|webm|pdf)$/i.test(storageKey)
    ) {
      throw new NotFoundException('Media not found.');
    }

    const media = await this.prisma.media.findFirst({
      where: { storageKey },
    });

    if (!media) {
      throw new NotFoundException('Media not found.');
    }

    const filePath = join(this.uploadDir, storageKey);

    try {
      const buffer = await readFile(filePath);
      return { buffer, media };
    } catch {
      throw new NotFoundException('Media file not found.');
    }
  }

  async remove(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: { blogCovers: { select: { id: true } } },
    });

    if (!media) {
      throw new NotFoundException('Media not found.');
    }

    if (media.blogCovers.length > 0) {
      throw new BadRequestException(
        'This media is used as a blog cover and cannot be deleted.',
      );
    }

    if (media.storageKey) {
      const filePath = join(this.uploadDir, basename(media.storageKey));

      if (
        !filePath.startsWith(`${this.uploadDir}\\`) &&
        !filePath.startsWith(`${this.uploadDir}/`)
      ) {
        throw new BadRequestException('Invalid media storage path.');
      }

      await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }

    await this.prisma.media.delete({ where: { id } });

    return { success: true, id };
  }

  private async getImageDimensions(
    buffer: Buffer,
    mime: string,
  ): Promise<{ width: number; height: number } | null> {
    if (
      mime !== 'image/png' &&
      mime !== 'image/jpeg' &&
      mime !== 'image/webp'
    ) {
      return null;
    }

    if (mime === 'image/png' && buffer.length >= 24) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }

    if (mime === 'image/jpeg') {
      return this.jpegDimensions(buffer);
    }

    if (mime === 'image/webp' && buffer.length >= 30) {
      const chunk = buffer.toString('ascii', 12, 16);

      if (chunk === 'VP8X') {
        return {
          width: 1 + buffer.readUIntLE(24, 3),
          height: 1 + buffer.readUIntLE(27, 3),
        };
      }
    }

    return null;
  }

  private jpegDimensions(
    buffer: Buffer,
  ): { width: number; height: number } | null {
    let offset = 2;

    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = buffer[offset + 1];
      const segmentLength = buffer.readUInt16BE(offset + 2);

      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      if (segmentLength < 2) return null;
      offset += 2 + segmentLength;
    }

    return null;
  }
}
