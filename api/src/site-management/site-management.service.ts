import { Injectable, NotFoundException } from '@nestjs/common';
import { Language, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { ReorderHomeSectionsDto } from './dto/reorder-home-sections.dto';

@Injectable()
export class SiteManagementService {
  constructor(private readonly prisma: PrismaService) {}

  findAllAdmin() {
    return this.prisma.pageSection.findMany({
      include: {
        translations: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }
  async updateSection(id: string, dto: UpdateHomeSectionDto) {
    const { translations, settings, ...fields } = dto;

    const section = await this.prisma.pageSection.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('Page section not found.');
    }

    return this.prisma.pageSection.update({
      where: { id },
      data: {
        ...fields,

        ...(settings !== undefined
          ? {
              settings: settings as Prisma.InputJsonValue,
            }
          : {}),

        ...(translations !== undefined
          ? {
              translations: {
                upsert: translations.map((translation) => {
                  const { language, content, ...translationFields } =
                    translation;

                  if (!language) {
                    throw new Error('Translation language is required.');
                  }

                  const jsonContent = content as
                    Prisma.InputJsonValue | undefined;

                  return {
                    where: {
                      sectionId_language: {
                        sectionId: id,
                        language,
                      },
                    },
                    create: {
                      language,
                      ...translationFields,
                      ...(jsonContent !== undefined
                        ? { content: jsonContent }
                        : {}),
                    },
                    update: {
                      ...translationFields,
                      ...(jsonContent !== undefined
                        ? { content: jsonContent }
                        : {}),
                    },
                  };
                }),
              },
            }
          : {}),
      },
      include: {
        translations: true,
      },
    });
  }

  async reorderSections(dto: ReorderHomeSectionsDto) {
    const ids = dto.sections.map((section) => section.id);

    if (new Set(ids).size !== ids.length) {
      throw new Error('Duplicate section IDs are not allowed.');
    }

    await this.prisma.$transaction(
      dto.sections.map((section) =>
        this.prisma.pageSection.update({
          where: { id: section.id },
          data: {
            sortOrder: section.sortOrder,
          },
        }),
      ),
    );

    return this.findAllAdmin();
  }

  findPublicSections(lang: Language) {
    return this.prisma.pageSection.findMany({
      where: {
        enabled: true,
        translations: {
          some: { language: lang },
        },
      },
      include: {
        translations: {
          where: { language: lang },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }
}
