import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLanguageSkillDto } from './dto/create-language-skill.dto';
import { UpdateLanguageSkillDto } from './dto/update-language-skill.dto';
import { QueryLanguageSkillsDto } from './dto/query-language-skills.dto';

@Injectable()
export class LanguageSkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(query: QueryLanguageSkillsDto) {
    const { lang } = query;

    return this.prisma.languageSkill.findMany({
      where: { enabled: true },
      include: {
        translations: {
          where: { language: lang },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllAdmin() {
    return this.prisma.languageSkill.findMany({
      include: { translations: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOneAdmin(id: string) {
    const skill = await this.prisma.languageSkill.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!skill) {
      throw new NotFoundException('Language skill not found.');
    }

    return skill;
  }

  async create(dto: CreateLanguageSkillDto) {
    const { translations, ...fields } = dto;

    try {
      return await this.prisma.languageSkill.create({
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

  async update(id: string, dto: UpdateLanguageSkillDto) {
    const { translations, ...fields } = dto;

    try {
      return await this.prisma.languageSkill.update({
        where: { id },
        data: {
          ...fields,
          ...(translations !== undefined
            ? {
                translations: {
                  upsert: translations.map((translation) => ({
                    where: {
                      languageSkillId_language: {
                        languageSkillId: id,
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
      return await this.prisma.languageSkill.delete({
        where: { id },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Language skill not found.');
      }

      if (error.code === 'P2002') {
        throw new ConflictException(
          'A language skill translation with this language already exists.',
        );
      }
    }

    throw error;
  }
}
