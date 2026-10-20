import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Language, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(lang: Language) {
    const profile = await this.prisma.profile.findFirst({
      include: {
        translations: {
          where: { language: lang },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    return profile;
  }

  async findAllAdmin() {
    return this.prisma.profile.findMany({
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateProfileDto) {
    const { translations, ...fields } = dto;

    try {
      return await this.prisma.profile.create({
        data: {
          ...fields,
          translations: {
            create: translations,
          },
        },
        include: { translations: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, dto: UpdateProfileDto) {
    const { translations, ...fields } = dto;

    try {
      return await this.prisma.profile.update({
        where: { id },
        data: {
          ...fields,
          ...(translations !== undefined
            ? {
                translations: {
                  upsert: translations.map((translation) => ({
                    where: {
                      profileId_language: {
                        profileId: id,
                        language: translation.language,
                      },
                    },
                    create: translation,
                    update: {
                      fullName: translation.fullName,
                      role: translation.role,
                      bio: translation.bio,
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

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Profile not found.');
      }

      if (error.code === 'P2002') {
        throw new ConflictException(
          'A profile translation with this language already exists.',
        );
      }
    }

    throw error;
  }
}
