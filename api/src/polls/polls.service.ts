import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Language,
  PollStatus,
  PollType,
  Prisma,
} from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';

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
        _count: {
          select: { votes: true },
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
        _count: {
          select: { votes: true },
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
        _count: {
          select: { votes: true },
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
  async vote(pollId: string, dto: VotePollDto) {
    // A voter must not submit the same option more than once.
    const optionIds = [...new Set(dto.optionIds)];

    if (optionIds.length !== dto.optionIds.length) {
      throw new BadRequestException('Duplicate option IDs are not allowed.');
    }

    if (optionIds.length === 0) {
      throw new BadRequestException('At least one option must be selected.');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Confirm that the poll exists, is published, and is currently active.
      const poll = await tx.poll.findFirst({
        where: {
          id: pollId,
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
          type: true,
        },
      });

      if (!poll) {
        throw new NotFoundException('Poll not found or voting is closed.');
      }

      // Single-choice polls accept exactly one selected option.
      if (poll.type === PollType.SINGLE_CHOICE && optionIds.length !== 1) {
        throw new BadRequestException('Select exactly one option.');
      }

      // Ensure that every submitted option belongs to this poll.
      const validOptions = await tx.pollOption.findMany({
        where: {
          pollId,
          id: { in: optionIds },
        },
        select: { id: true },
      });

      if (validOptions.length !== optionIds.length) {
        throw new BadRequestException(
          'An option does not belong to this poll.',
        );
      }

      // Check whether this voter has already submitted a vote.
      const existingVote = await tx.pollVote.findFirst({
        where: {
          pollId,
          voterKey: dto.voterKey,
        },
        select: { id: true },
      });

      if (existingVote) {
        throw new ConflictException('This voter has already voted.');
      }

      // Insert all selected options as one transaction.
      try {
        await tx.pollVote.createMany({
          data: optionIds.map((optionId) => ({
            pollId,
            optionId,
            voterKey: dto.voterKey,
          })),
        });
      } catch (error) {
        // Convert database uniqueness violations into a conflict response.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('A duplicate vote was detected.');
        }

        throw error;
      }

      return {
        message: 'Vote submitted successfully.',
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Public: Poll results
  // ---------------------------------------------------------------------------

  /**
   * Returns aggregated results when public result visibility is enabled.
   */
  async getResults(id: string, language: Language) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
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
