import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperienceAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.experience.findMany({
      include: { translations: true },
      orderBy: [
        { sortOrder: 'asc' },
        { startDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found.');
    }

    return experience;
  }

  async create(dto: CreateExperienceDto) {
    const { translations, startDate, endDate, ...fields } = dto;

    const normalizedStartDate = startDate ? new Date(startDate) : null;

    // Prevent duplicate experience records.
    const existingExperience = await this.prisma.experience.findFirst({
      where: {
        organization: fields.organization,
        position: fields.position ?? null,
        startDate: normalizedStartDate,
      },
    });

    if (existingExperience) {
      throw new ConflictException(
        'An experience with the same organization, position, and start date already exists.',
      );
    }

    return this.prisma.experience.create({
      data: {
        ...fields,
        startDate: normalizedStartDate,
        ...(endDate !== undefined
          ? { endDate: endDate ? new Date(endDate) : null }
          : {}),
        translations: { create: translations },
      },
      include: { translations: true },
    });
  }

  async update(id: string, dto: UpdateExperienceDto) {
    const { translations, startDate, endDate, ...fields } = dto;

    try {
      return await this.prisma.experience.update({
        where: { id },
        data: {
          ...fields,
          ...(startDate !== undefined
            ? { startDate: startDate ? new Date(startDate) : null }
            : {}),
          ...(endDate !== undefined
            ? { endDate: endDate ? new Date(endDate) : null }
            : {}),
          ...(translations !== undefined
            ? {
                translations: {
                  upsert: translations.map((translation) => ({
                    where: {
                      experienceId_language: {
                        experienceId: id,
                        language: translation.language,
                      },
                    },
                    create: translation,
                    update: {
                      title: translation.title,
                      description: translation.description,
                    },
                  })),
                },
              }
            : {}),
        },
        include: { translations: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.experience.delete({
        where: { id },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Experience not found.');
      }
    }

    throw error;
  }
}
