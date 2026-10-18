import { Injectable } from '@nestjs/common';
import { Language } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService) {}

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
}
