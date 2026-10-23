import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogArticleDto } from './dto/create-blog-article.dto';
import { UpdateBlogArticleDto } from './dto/update-blog-article.dto';
import { QueryBlogArticlesDto } from './dto/query-blog-articles.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateCoverMedia(coverMediaId?: string | null) {
    if (!coverMediaId) {
      return;
    }

    const media = await this.prisma.media.findUnique({
      where: { id: coverMediaId },
      select: {
        id: true,
        type: true,
      },
    });

    if (!media) {
      throw new NotFoundException('Cover media not found.');
    }

    if (media.type !== MediaType.IMAGE) {
      throw new BadRequestException('Blog cover must be an image.');
    }
  }

  private readonly articleInclude = {
    translations: true,
    coverMedia: true,
    categories: {
      include: {
        category: {
          include: { translations: true },
        },
      },
    },
    tags: {
      include: {
        tag: {
          include: { translations: true },
        },
      },
    },
  } satisfies Prisma.BlogArticleInclude;

  async findAllAdmin() {
    return this.prisma.blogArticle.findMany({
      include: this.articleInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateBlogArticleDto) {
    const { translations, categoryIds, tagIds, ...articleData } = dto;

    await this.validateCoverMedia(articleData.coverMediaId);

    return this.prisma.blogArticle.create({
      data: {
        status: articleData.status ?? 'DRAFT',
        featured: articleData.featured ?? false,
        allowComments: articleData.allowComments ?? true,
        coverMediaId: articleData.coverMediaId,
        publishedAt: articleData.publishedAt
          ? new Date(articleData.publishedAt)
          : undefined,
        scheduledAt: articleData.scheduledAt
          ? new Date(articleData.scheduledAt)
          : undefined,
        translations: {
          create: translations.map((translation) => ({
            ...translation,
            content: translation.content as Prisma.InputJsonValue,
          })),
        },
        categories: categoryIds?.length
          ? {
              create: categoryIds.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: this.articleInclude,
    });
  }

  async update(id: string, dto: UpdateBlogArticleDto) {
    const existing = await this.prisma.blogArticle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Blog article not found');
    }

    const { translations, categoryIds, tagIds, ...articleData } = dto;

    await this.validateCoverMedia(articleData.coverMediaId);

    return this.prisma.$transaction(async (tx) => {
      if (translations) {
        for (const translation of translations) {
          await tx.blogArticleTranslation.upsert({
            where: {
              articleId_language: {
                articleId: id,
                language: translation.language,
              },
            },
            create: {
              articleId: id,
              ...translation,
              content: translation.content as Prisma.InputJsonValue,
            },
            update: {
              title: translation.title,
              slug: translation.slug,
              excerpt: translation.excerpt,
              content: translation.content as Prisma.InputJsonValue,
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription,
              canonicalUrl: translation.canonicalUrl,
            },
          });
        }
      }

      if (categoryIds !== undefined) {
        await tx.blogArticleCategory.deleteMany({
          where: { articleId: id },
        });

        if (categoryIds.length) {
          await tx.blogArticleCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              articleId: id,
              categoryId,
            })),
          });
        }
      }

      if (tagIds !== undefined) {
        await tx.blogArticleTag.deleteMany({
          where: { articleId: id },
        });

        if (tagIds.length) {
          await tx.blogArticleTag.createMany({
            data: tagIds.map((tagId) => ({
              articleId: id,
              tagId,
            })),
          });
        }
      }

      return tx.blogArticle.update({
        where: { id },
        data: {
          status: articleData.status,
          featured: articleData.featured,
          allowComments: articleData.allowComments,
          coverMediaId: articleData.coverMediaId,
          publishedAt: articleData.publishedAt
            ? new Date(articleData.publishedAt)
            : articleData.publishedAt === null
              ? null
              : undefined,
          scheduledAt: articleData.scheduledAt
            ? new Date(articleData.scheduledAt)
            : articleData.scheduledAt === null
              ? null
              : undefined,
        },
        include: this.articleInclude,
      });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.blogArticle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Blog article not found');
    }

    await this.prisma.blogArticle.delete({ where: { id } });
    return { success: true };
  }

  async findAllPublic(query: QueryBlogArticlesDto) {
    const now = new Date();
    const where: Prisma.BlogArticleWhereInput = {
      status: 'PUBLISHED',
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
      translations: {
        some: { language: query.lang as any },
      },
      ...(query.category
        ? {
            categories: {
              some: {
                category: {
                  enabled: true,
                  translations: {
                    some: {
                      language: query.lang as any,
                      slug: query.category,
                    },
                  },
                },
              },
            },
          }
        : {}),
      ...(query.tag
        ? {
            tags: {
              some: {
                tag: {
                  enabled: true,
                  translations: {
                    some: {
                      language: query.lang as any,
                      slug: query.tag,
                    },
                  },
                },
              },
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.blogArticle.findMany({
        where,
        include: {
          translations: {
            where: { language: query.lang as any },
          },
          coverMedia: true,
          categories: {
            include: {
              category: {
                include: {
                  translations: {
                    where: { language: query.lang as any },
                  },
                },
              },
            },
          },
          tags: {
            include: {
              tag: {
                include: {
                  translations: {
                    where: { language: query.lang as any },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.blogArticle.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findPublicBySlug(slug: string, lang: string) {
    const article = await this.prisma.blogArticle.findFirst({
      where: {
        status: 'PUBLISHED',
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
        translations: {
          some: { slug, language: lang as any },
        },
      },
      include: {
        translations: {
          where: { language: lang as any },
        },
        coverMedia: true,
        categories: {
          include: {
            category: {
              include: {
                translations: {
                  where: { language: lang as any },
                },
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              include: {
                translations: {
                  where: { language: lang as any },
                },
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Blog article not found');
    }

    return article;
  }
}
