import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { CreateBlogTagDto } from './dto/create-blog-tag.dto';
import { UpdateBlogTagDto } from './dto/update-blog-tag.dto';

@Injectable()
export class BlogTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  // Categories
  findAllCategories() {
    return this.prisma.blogCategory.findMany({
      include: { translations: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  createCategory(dto: CreateBlogCategoryDto) {
    return this.prisma.blogCategory.create({
      data: {
        enabled: dto.enabled ?? true,
        sortOrder: dto.sortOrder ?? 0,
        translations: {
          create: dto.translations,
        },
      },
      include: { translations: true },
    });
  }

  async updateCategory(id: string, dto: UpdateBlogCategoryDto) {
    const exists = await this.prisma.blogCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Blog category not found');

    return this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        for (const translation of dto.translations) {
          await tx.blogCategoryTranslation.upsert({
            where: {
              categoryId_language: {
                categoryId: id,
                language: translation.language,
              },
            },
            create: {
              categoryId: id,
              ...translation,
            },
            update: {
              name: translation.name,
              slug: translation.slug,
              description: translation.description,
            },
          });
        }
      }

      return tx.blogCategory.update({
        where: { id },
        data: {
          enabled: dto.enabled,
          sortOrder: dto.sortOrder,
        },
        include: { translations: true },
      });
    });
  }

  async removeCategory(id: string) {
    const exists = await this.prisma.blogCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Blog category not found');

    await this.prisma.blogCategory.delete({ where: { id } });
    return { success: true };
  }

  // Tags
  findAllTags() {
    return this.prisma.blogTag.findMany({
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createTag(dto: CreateBlogTagDto) {
    return this.prisma.blogTag.create({
      data: {
        enabled: dto.enabled ?? true,
        translations: {
          create: dto.translations,
        },
      },
      include: { translations: true },
    });
  }

  async updateTag(id: string, dto: UpdateBlogTagDto) {
    const exists = await this.prisma.blogTag.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Blog tag not found');

    return this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        for (const translation of dto.translations) {
          await tx.blogTagTranslation.upsert({
            where: {
              tagId_language: {
                tagId: id,
                language: translation.language,
              },
            },
            create: {
              tagId: id,
              ...translation,
            },
            update: {
              name: translation.name,
              slug: translation.slug,
            },
          });
        }
      }

      return tx.blogTag.update({
        where: { id },
        data: { enabled: dto.enabled },
        include: { translations: true },
      });
    });
  }

  async removeTag(id: string) {
    const exists = await this.prisma.blogTag.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Blog tag not found');

    await this.prisma.blogTag.delete({ where: { id } });
    return { success: true };
  }
}
