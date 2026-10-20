import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { QuerySkillsDto } from './dto/query-skills.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(query: QuerySkillsDto) {
    const { lang, category, featured } = query;

    return this.prisma.skill.findMany({
      where: {
        enabled: true,
        ...(category ? { category } : {}),
        ...(featured !== undefined ? { featured } : {}),
      },
      include: {
        translations: {
          where: { language: lang },
        },
      },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllAdmin() {
    return this.prisma.skill.findMany({
      include: { translations: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOneAdmin(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found.');
    }

    return skill;
  }

  async create(dto: CreateSkillDto) {
    const { translations, ...fields } = dto;

    try {
      return await this.prisma.skill.create({
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

  async update(id: string, dto: UpdateSkillDto) {
    const { translations, ...fields } = dto;

    try {
      return await this.prisma.skill.update({
        where: { id },
        data: {
          ...fields,
          ...(translations !== undefined
            ? {
                translations: {
                  upsert: translations.map((translation) => ({
                    where: {
                      skillId_language: {
                        skillId: id,
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
      return await this.prisma.skill.delete({
        where: { id },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Skill not found.');
      }

      if (error.code === 'P2002') {
        throw new ConflictException(
          'A skill translation with this language already exists.',
        );
      }
    }

    throw error;
  }
}
