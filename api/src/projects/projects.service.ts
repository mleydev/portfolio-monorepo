import { PrismaService } from '../prisma/prisma.service';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { Language } from '../../generated/prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A project with this slug already exists.');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Project not found.');
      }
    }

    throw error;
  }

  async findAll(query: QueryProjectsDto) {
    const { lang, page, limit } = query;

    const skip = (page - 1) * limit;

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: {
          published: true,
        },
        include: {
          translations: {
            where: {
              language: lang as Language,
            },
          },
        },
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            publishedAt: 'desc',
          },
        ],
        skip,
        take: limit,
      }),
      this.prisma.project.count({
        where: {
          published: true,
        },
      }),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllAdmin() {
    return this.prisma.project.findMany({
      include: {
        translations: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: CreateProjectDto) {
    const { translations, published, ...fields } = dto;

    try {
      return await this.prisma.project.create({
        data: {
          ...fields,
          published: published ?? false,
          publishedAt: published ? new Date() : null,
          translations: {
            create: translations.map((translation) => ({
              ...translation,
              language: translation.language,
            })),
          },
        },
        include: {
          translations: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, dto: UpdateProjectDto) {
    const { translations, published, ...fields } = dto;

    try {
      return await this.prisma.project.update({
        where: { id },
        data: {
          ...fields,

          ...(published !== undefined
            ? {
                published,
                publishedAt: published ? new Date() : null,
              }
            : {}),

          ...(translations !== undefined
            ? {
                translations: {
                  upsert: translations.map((translation) => ({
                    where: {
                      projectId_language: {
                        projectId: id,
                        language: translation.language,
                      },
                    },
                    create: {
                      ...translation,
                      language: translation.language,
                    },
                    update: {
                      title: translation.title,
                      summary: translation.summary,
                      description: translation.description,
                      content: translation.content,
                      role: translation.role,
                      metaTitle: translation.metaTitle,
                      metaDescription: translation.metaDescription,
                    },
                  })),
                },
              }
            : {}),
        },
        include: {
          translations: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }
}
