import { Language } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNavigationItemDto } from './dto/create-navigation-item.dto';
import { CreateNavigationMenuDto } from './dto/create-navigation-menu.dto';
import { UpdateNavigationMenuDto } from './dto/update-navigation-menu.dto';

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService) {}

  async createMenu(dto: CreateNavigationMenuDto) {
    const existingMenu = await this.prisma.navigationMenu.findUnique({
      where: { key: dto.key },
      select: { id: true },
    });

    if (existingMenu) {
      throw new ConflictException('A menu with this key already exists.');
    }

    // Create the menu with safe defaults.
    return this.prisma.navigationMenu.create({
      data: {
        key: dto.key,
        title: dto.title,
        location: dto.location,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async createItem(menuKey: string, dto: CreateNavigationItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const menu = await tx.navigationMenu.findUnique({
        where: { key: menuKey },
        select: { id: true },
      });

      if (!menu) {
        throw new NotFoundException('Navigation menu not found.');
      }

      return tx.navigationItem.create({
        data: {
          menuId: menu.id,
          key: dto.key,
          href: dto.href,
          external: dto.external ?? false,
          enabled: dto.enabled ?? true,
          sortOrder: dto.sortOrder ?? 0,
          translations: {
            create: dto.translations.map((translation) => ({
              language: translation.language,
              label: translation.label,
            })),
          },
        },
        include: {
          translations: true,
        },
      });
    });
  }

  async findPublicMenu(key: string, language: Language) {
    return this.prisma.navigationMenu.findFirst({
      where: {
        key,
        enabled: true,
      },
      select: {
        key: true,
        title: true,
        location: true,
        items: {
          where: {
            enabled: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            key: true,
            href: true,
            external: true,
            sortOrder: true,
            translations: {
              where: { language },
              select: { label: true },
              take: 1,
            },
          },
        },
      },
    });
  }

  async findAllMenus() {
    return this.prisma.navigationMenu.findMany({
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            translations: true,
          },
        },
      },
      orderBy: { key: 'asc' },
    });
  }

  async updateMenu(key: string, dto: UpdateNavigationMenuDto) {
    const existingMenu = await this.prisma.navigationMenu.findUnique({
      where: { key },
      select: { id: true },
    });

    if (!existingMenu) {
      throw new NotFoundException('Navigation menu not found.');
    }

    // Update only the fields provided by the client.
    return this.prisma.navigationMenu.update({
      where: { key },
      data: dto,
    });
  }

  async deleteMenu(key: string) {
    const existingMenu = await this.prisma.navigationMenu.findUnique({
      where: { key },
      select: { id: true },
    });

    if (!existingMenu) {
      throw new NotFoundException('Navigation menu not found.');
    }

    // Delete the menu only after confirming it exists.
    return this.prisma.navigationMenu.delete({
      where: { key },
    });
  }
}
