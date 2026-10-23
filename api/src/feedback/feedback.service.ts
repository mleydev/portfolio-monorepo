import { Injectable, NotFoundException } from '@nestjs/common';
import { FeedbackStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        name: dto.name?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        subject: dto.subject?.trim() || null,
        content: dto.content.trim(),
        rating: dto.rating ?? null,
      },
      select: { id: true, status: true, createdAt: true },
    });
  }

  findAllAdmin(status?: FeedbackStatus) {
    return this.prisma.feedback.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async setStatus(id: string, status: FeedbackStatus) {
    await this.ensureExists(id);

    return this.prisma.feedback.update({
      where: { id },
      data: { status },
    });
  }

  async reply(id: string, adminReply: string) {
    await this.ensureExists(id);

    return this.prisma.feedback.update({
      where: { id },
      data: {
        adminReply: adminReply.trim(),
        repliedAt: new Date(),
        status: FeedbackStatus.ANSWERED,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.feedback.delete({ where: { id } });
    return { message: 'Feedback deleted successfully.' };
  }

  private async ensureExists(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!feedback) throw new NotFoundException('Feedback not found.');
  }
}
