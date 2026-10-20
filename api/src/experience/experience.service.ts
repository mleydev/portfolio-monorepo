import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryExperienceDto } from './dto/query-experience.dto';

@Injectable()
export class ExperienceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryExperienceDto) {
    const { lang, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExperienceWhereInput = {
      enabled: true,
      translations: {
        some: {
          language: lang,
        },
      },
    };

    const [experiences, total] = await this.prisma.$transaction([
      this.prisma.experience.findMany({
        where,
        include: {
          translations: {
            where: { language: lang },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.experience.count({ where }),
    ]);

    return {
      data: experiences,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
