import { Injectable, NotFoundException } from '@nestjs/common';
import { Language, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { ReorderHomeSectionsDto } from './dto/reorder-home-sections.dto';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpsertSiteSettingDto } from './dto/upsert-site-setting.dto';

@Injectable()
export class SiteManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllSettingsAdmin() {
    return this.prisma.siteSettings.findMany({
      include: {
        translations: true,
      },
      orderBy: {
        key: 'asc',
      },
    });
  }

  async upsertSetting(key: string, dto: UpsertSiteSettingDto) {
    const existing = await this.prisma.siteSettings.findUnique({
      where: { key },
      select: { id: true },
    });

    const setting = existing
      ? await this.prisma.siteSettings.update({
          where: { key },
          data: {
            ...(dto.value !== undefined
              ? { value: dto.value as Prisma.InputJsonValue }
              : {}),
          },
        })
      : await this.prisma.siteSettings.create({
          data: {
            key,
            ...(dto.value !== undefined
              ? { value: dto.value as Prisma.InputJsonValue }
              : {}),
          },
        });

    if (dto.translations?.length) {
      const languages = dto.translations.map((item) => item.language);

      if (new Set(languages).size !== languages.length) {
        throw new Error('Duplicate translation languages are not allowed.');
      }

      await this.prisma.$transaction(
        dto.translations.map((translation) =>
          this.prisma.siteSettingsTranslation.upsert({
            where: {
              settingsId_language: {
                settingsId: setting.id,
                language: translation.language,
              },
            },
            create: {
              settingsId: setting.id,
              language: translation.language,
              value: translation.value as Prisma.InputJsonValue,
            },
            update: {
              value: translation.value as Prisma.InputJsonValue,
            },
          }),
        ),
      );
    }

    return this.prisma.siteSettings.findUnique({
      where: { id: setting.id },
      include: {
        translations: true,
      },
    });
  }

  async findPublicSettings(lang: Language) {
    const publicKeys = ['site', 'contact', 'social-links', 'seo', 'footer'];

    const settings = await this.prisma.siteSettings.findMany({
      where: {
        key: { in: publicKeys },
      },
      include: {
        translations: {
          where: { language: lang },
        },
      },
      orderBy: {
        key: 'asc',
      },
    });

    return Object.fromEntries(
      settings.map((setting) => [
        setting.key,
        setting.translations[0]?.value ?? setting.value,
      ]),
    );
  }

  async createSection(dto: CreateHomeSectionDto) {
    return this.prisma.pageSection.create({
      data: {
        key: dto.key,
        type: dto.type,
        enabled: dto.enabled ?? true,
        sortOrder: dto.sortOrder ?? 0,
        settings: dto.settings as any,

        translations: {
          create: dto.translations.map((translation) => ({
            language: translation.language,
            title: translation.title,
            subtitle: translation.subtitle,
            description: translation.description,
            content: translation.content as any,
          })),
        },
      },
      include: {
        translations: true,
      },
    });
  }

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
