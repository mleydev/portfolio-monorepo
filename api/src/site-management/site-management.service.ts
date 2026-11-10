import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Language, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { ReorderHomeSectionsDto } from './dto/reorder-home-sections.dto';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpsertSiteSettingDto } from './dto/upsert-site-setting.dto';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdateSocialLinkDto } from './dto/update-social-link.dto';

@Injectable()
export class SiteManagementService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDefaultLanguage(): Promise<Language> {
    const setting = await this.prisma.siteSettings.findUnique({
      where: { key: 'site' },
      select: { value: true },
    });

    const value = setting?.value as Record<string, unknown> | null;
    const configuredLanguage = value?.defaultLanguage;

    if (
      typeof configuredLanguage === 'string' &&
      Object.values(Language).includes(configuredLanguage as Language)
    ) {
      return configuredLanguage as Language;
    }

    return Language.fa;
  }

  private validateUniqueLanguages(translations: { language: Language }[]) {
    const languages = translations.map((translation) => translation.language);

    if (new Set(languages).size !== languages.length) {
      throw new BadRequestException(
        'Duplicate translation languages are not allowed.',
      );
    }
  }

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
      this.validateUniqueLanguages(dto.translations);
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

    const defaultLanguage = await this.getDefaultLanguage();

    const settings = await this.prisma.siteSettings.findMany({
      where: {
        key: { in: publicKeys },
      },
      include: {
        translations: true,
      },
      orderBy: {
        key: 'asc',
      },
    });

    return Object.fromEntries(
      settings.map((setting) => {
        const translation =
          setting.translations.find((item) => item.language === lang) ??
          setting.translations.find(
            (item) => item.language === defaultLanguage,
          );

        return [setting.key, translation?.value ?? setting.value];
      }),
    );
  }

  async createSection(dto: CreateHomeSectionDto) {
    this.validateUniqueLanguages(dto.translations);
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

    if (translations !== undefined) {
      this.validateUniqueLanguages(translations);
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
                    throw new BadRequestException(
                      'Translation language is required.',
                    );
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
      throw new BadRequestException('Duplicate section IDs are not allowed.');
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

  async findPublicSections(lang: Language) {
    const defaultLanguage = await this.getDefaultLanguage();

    const sections = await this.prisma.pageSection.findMany({
      where: {
        enabled: true,
      },
      include: {
        translations: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return sections.map((section) => {
      const translation =
        section.translations.find((item) => item.language === lang) ??
        section.translations.find(
          (item) => item.language === defaultLanguage,
        ) ??
        section.translations[0];

      return {
        ...section,
        translations: translation ? [translation] : [],
      };
    });
  }

  async findAllSocialLinksAdmin() {
    return this.prisma.socialLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createSocialLink(dto: CreateSocialLinkDto) {
    const existing = await this.prisma.socialLink.findFirst({
      where: { url: dto.url },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'A social link with this URL already exists.',
      );
    }

    return this.prisma.socialLink.create({
      data: {
        platform: dto.platform,
        label: dto.label,
        url: dto.url,
        icon: dto.icon,
        enabled: dto.enabled ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateSocialLink(id: string, dto: UpdateSocialLinkDto) {
    const existing = await this.prisma.socialLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Social link not found.');
    }

    if (dto.url !== undefined && dto.url !== existing.url) {
      const duplicate = await this.prisma.socialLink.findFirst({
        where: {
          url: dto.url,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new BadRequestException(
          'A social link with this URL already exists.',
        );
      }
    }

    return this.prisma.socialLink.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSocialLink(id: string) {
    const existing = await this.prisma.socialLink.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Social link not found.');
    }

    return this.prisma.socialLink.delete({
      where: { id },
    });
  }

  async findPublicSocialLinks() {
    return this.prisma.socialLink.findMany({
      where: {
        enabled: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        platform: true,
        label: true,
        url: true,
        icon: true,
        sortOrder: true,
      },
    });
  }
}
