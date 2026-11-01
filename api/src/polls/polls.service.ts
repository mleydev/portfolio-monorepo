import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Language, PollStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';

@Injectable()
export class PollsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------

  /**
   * Ensures that each translation collection contains unique languages.
   */
  private validateTranslations(
    translations: Array<{ language: Language }>,
    field: string,
  ): void {
    const languages = translations.map(({ language }) => language);

    if (new Set(languages).size !== languages.length) {
      throw new BadRequestException(`Duplicate languages found in ${field}.`);
    }
  }

  /**
   * Validates the poll's optional start and end dates.
   */
  private validateDates(
    startsAt?: string | null,
    endsAt?: string | null,
  ): void {
    const startDate = startsAt ? new Date(startsAt) : null;
    const endDate = endsAt ? new Date(endsAt) : null;

    // Reject invalid dates before comparing them.
    if (
      (startDate && Number.isNaN(startDate.getTime())) ||
      (endDate && Number.isNaN(endDate.getTime()))
    ) {
      throw new BadRequestException('Invalid poll date.');
    }

    if (startDate && endDate && endDate <= startDate) {
      throw new BadRequestException('endsAt must be later than startsAt.');
    }
  }

  /**
   * Validates all fields supported by poll creation.
   */
  private validateCreate(dto: CreatePollDto): void {
    this.validateDates(dto.startsAt, dto.endsAt);
    this.validateTranslations(dto.translations, 'poll translations');

    for (const [index, option] of dto.options.entries()) {
      this.validateTranslations(
        option.translations,
        `translations for option ${index + 1}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Admin: Create and read polls
  // ---------------------------------------------------------------------------

  /**
   * Creates a poll with its translations and answer options.
   */
  async create(dto: CreatePollDto) {
    this.validateCreate(dto);

    return this.prisma.poll.create({
      data: {
        type: dto.type,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        showResults: dto.showResults ?? true,

        translations: {
          create: dto.translations,
        },

        options: {
          create: dto.options.map((option, index) => ({
            sortOrder: option.sortOrder ?? index,
            translations: {
              create: option.translations,
            },
          })),
        },
      },

      include: {
        translations: true,
        options: {
          include: {
            translations: true,
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Returns all polls for the admin panel, including vote counts.
   */
  async findAllAdmin() {
    return this.prisma.poll.findMany({
      include: {
        translations: true,
        options: {
          include: {
            translations: true,
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds one poll by ID or throws a 404 error.
   */
  async findOneAdmin(id: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
      include: {
        translations: true,
        options: {
          include: {
            translations: true,
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    return poll;
  }

  // ---------------------------------------------------------------------------
  // Public: Read published polls
  // ---------------------------------------------------------------------------

  /**
   * Returns currently active polls with translations for the requested language.
   */
  async findPublic(language: Language) {
    const now = new Date();

    const polls = await this.prisma.poll.findMany({
      where: {
        status: PollStatus.PUBLISHED,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },

      include: {
        translations: {
          where: { language },
        },
        options: {
          include: {
            translations: {
              where: { language },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },

      orderBy: { createdAt: 'desc' },
    });

    // Return only the requested language's translations for each option.
    return polls.map((poll) => ({
      ...poll,
      options: poll.options.map((option) => ({
        ...option,
        translations: option.translations,
      })),
    }));
  }

  // ---------------------------------------------------------------------------
  // Admin: Update poll status and delete polls
  // ---------------------------------------------------------------------------

  /**
   * Changes a poll's publication status.
   */
  async setStatus(id: string, status: PollStatus) {
    await this.findOneAdmin(id);

    return this.prisma.poll.update({
      where: { id },
      data: { status },
      include: {
        translations: true,
        options: {
          include: { translations: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Updates a poll and synchronizes its translations and options.
   * Existing option IDs are preserved to keep their votes intact.
   */
  async update(id: string, dto: UpdatePollDto) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    // Validate the resulting date range, including unchanged dates.
    this.validateDates(
      dto.startsAt !== undefined
        ? dto.startsAt
        : (poll.startsAt?.toISOString() ?? null),
      dto.endsAt !== undefined
        ? dto.endsAt
        : (poll.endsAt?.toISOString() ?? null),
    );

    if (dto.translations) {
      this.validateTranslations(dto.translations, 'poll translations');
    }

    if (dto.options) {
      for (const [index, option] of dto.options.entries()) {
        this.validateTranslations(
          option.translations,
          `translations for option ${index + 1}`,
        );
      }

      const submittedIds = dto.options
        .map((option) => option.id)
        .filter((optionId): optionId is string => Boolean(optionId));

      if (new Set(submittedIds).size !== submittedIds.length) {
        throw new BadRequestException('Duplicate option IDs are not allowed.');
      }

      const existingIds = new Set(poll.options.map((option) => option.id));

      if (submittedIds.some((optionId) => !existingIds.has(optionId))) {
        throw new BadRequestException(
          'One or more option IDs do not belong to this poll.',
        );
      }

      const removedOptions = poll.options.filter(
        (option) => !submittedIds.includes(option.id),
      );

      const optionsWithVotes = removedOptions.filter(
        (option) => option._count.votes > 0,
      );

      if (optionsWithVotes.length > 0) {
        throw new BadRequestException(
          'Options with existing votes cannot be removed.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData = {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.startsAt !== undefined
          ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }
          : {}),
        ...(dto.endsAt !== undefined
          ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }
          : {}),
        ...(dto.showResults !== undefined
          ? { showResults: dto.showResults }
          : {}),
        ...(dto.translations
          ? {
              translations: {
                deleteMany: {},
                create: dto.translations,
              },
            }
          : {}),
      };

      await tx.poll.update({
        where: { id },
        data: updateData,
      });

      if (dto.options) {
        const submittedIds = dto.options
          .map((option) => option.id)
          .filter((optionId): optionId is string => Boolean(optionId));

        const removedIds = poll.options
          .filter((option) => !submittedIds.includes(option.id))
          .map((option) => option.id);

        if (removedIds.length > 0) {
          await tx.pollOption.deleteMany({
            where: {
              pollId: id,
              id: { in: removedIds },
            },
          });
        }

        for (const [index, option] of dto.options.entries()) {
          if (option.id) {
            await tx.pollOption.update({
              where: { id: option.id },
              data: {
                sortOrder: option.sortOrder ?? index,
                translations: {
                  deleteMany: {},
                  create: option.translations,
                },
              },
            });
          } else {
            await tx.pollOption.create({
              data: {
                pollId: id,
                sortOrder: option.sortOrder ?? index,
                translations: {
                  create: option.translations,
                },
              },
            });
          }
        }
      }

      return tx.poll.findUnique({
        where: { id },
        include: {
          translations: true,
          options: {
            include: {
              translations: true,
              _count: {
                select: { votes: true },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Deletes a poll. Related records are handled by the schema's cascade rules.
   */
  async remove(id: string) {
    await this.findOneAdmin(id);

    await this.prisma.poll.delete({
      where: { id },
    });

    return {
      message: 'Poll deleted successfully.',
    };
  }

  // ---------------------------------------------------------------------------
  // Public: Submit votes
  // ---------------------------------------------------------------------------

  /**
   * Validates and records a vote inside a database transaction.
   */

  /**
   * Validates and records a ballot inside a database transaction.
   */
  async vote(pollId: string, dto: VotePollDto, voterKey: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll || poll.status !== 'PUBLISHED') {
      throw new NotFoundException(
        'نظرسنجی مورد نظر یافت نشد یا در دسترس نیست.',
      );
    }

    const now = new Date();
    if (
      (poll.startsAt && now < poll.startsAt) ||
      (poll.endsAt && now > poll.endsAt)
    ) {
      throw new BadRequestException(
        'مهلت شرکت در این نظرسنجی به پایان رسیده است.',
      );
    }

    const optionIds = dto.optionIds;
    if (!optionIds || optionIds.length === 0) {
      throw new BadRequestException('حداقل یک گزینه باید انتخاب شود.');
    }

    if (poll.type === 'SINGLE_CHOICE' && optionIds.length > 1) {
      throw new BadRequestException(
        'در این نظرسنجی تنها امکان انتخاب یک گزینه وجود دارد.',
      );
    }

    const uniqueOptionIds = [...new Set(optionIds)];
    if (uniqueOptionIds.length !== optionIds.length) {
      throw new BadRequestException('گزینه‌های تکراری مجاز نیستند.');
    }

    const validOptionIds = poll.options.map((o) => o.id);
    const isValid = optionIds.every((id) => validOptionIds.includes(id));
    if (!isValid) {
      throw new BadRequestException('برخی از گزینه‌های انتخاب‌شده نامعتبرند.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const ballot = await tx.pollBallot.create({
          data: {
            pollId,
            voterKey,
          },
        });

        const voteData = optionIds.map((optionId) => ({
          ballotId: ballot.id,
          optionId,
        }));

        await tx.pollVote.createMany({
          data: voteData,
        });

        return { message: 'رای شما با موفقیت ثبت شد.', ballotId: ballot.id };
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('شما قبلاً در این نظرسنجی شرکت کرده‌اید.');
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Public: Poll results
  // ---------------------------------------------------------------------------

  /**
   * Returns aggregated results when public result visibility is enabled.
   */
  // ---------------------------------------------------------------------------
  // Admin: Poll results
  // ---------------------------------------------------------------------------

  /**
   * Returns poll results for administrators, regardless of showResults.
   * The public visibility setting is intentionally not checked here.
   */
  async getAdminResults(id: string, language: Language) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        type: true,
        showResults: true,
        createdAt: true,
        translations: {
          where: { language },
        },
        options: {
          select: {
            id: true,
            sortOrder: true,
            translations: {
              where: { language },
            },
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    // Aggregate all votes associated with the poll's options.
    const totalVotes = poll.options.reduce(
      (total, option) => total + option._count.votes,
      0,
    );

    return {
      id: poll.id,
      status: poll.status,
      type: poll.type,
      showResults: poll.showResults,
      createdAt: poll.createdAt,
      translations: poll.translations,
      totalVotes,
      options: poll.options.map((option) => {
        const votes = option._count.votes;

        return {
          id: option.id,
          sortOrder: option.sortOrder,
          translations: option.translations,
          votes,
          percentage:
            totalVotes === 0
              ? 0
              : Math.round((votes / totalVotes) * 10000) / 100,
        };
      }),
    };
  }
  async getResults(id: string, language: Language) {
    const now = new Date();

    const poll = await this.prisma.poll.findFirst({
      where: {
        id,
        status: PollStatus.PUBLISHED,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      select: {
        id: true,
        showResults: true,

        translations: {
          where: { language },
        },

        options: {
          select: {
            id: true,
            sortOrder: true,

            translations: {
              where: { language },
            },

            _count: {
              select: { votes: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    if (!poll.showResults) {
      throw new BadRequestException('Results are not publicly available.');
    }

    // Sum the votes recorded against each option.
    const totalVotes = poll.options.reduce(
      (total, option) => total + option._count.votes,
      0,
    );

    return {
      id: poll.id,
      translations: poll.translations,
      totalVotes,

      options: poll.options.map((option) => {
        const votes = option._count.votes;

        return {
          id: option.id,
          sortOrder: option.sortOrder,
          translations: option.translations,
          votes,

          // Percentages are rounded to two decimal places.
          percentage:
            totalVotes === 0
              ? 0
              : Math.round((votes / totalVotes) * 10000) / 100,
        };
      }),
    };
  }
}
