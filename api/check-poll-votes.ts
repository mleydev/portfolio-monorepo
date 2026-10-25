import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const votes = await prisma.pollVote.findMany({
    select: {
      ballot: {
        select: {
          pollId: true,
          voterKey: true,
        },
      },
      optionId: true,
    },
  });

  const ballots = new Set(
    votes.map((vote) =>
      JSON.stringify([vote.ballot.pollId, vote.ballot.voterKey]),
    ),
  );

  const groups = new Map<string, number>();

  for (const vote of votes) {
    const key = JSON.stringify([
      vote.ballot.pollId,
      vote.ballot.voterKey,
      vote.optionId,
    ]);

    groups.set(key, (groups.get(key) ?? 0) + 1);
  }

  const duplicates = [...groups.entries()].filter(([, count]) => count > 1);

  console.log('\n--- Poll vote report ---');
  console.log('Total votes:', votes.length);
  console.log('Existing ballots:', ballots.size);
  console.log('Duplicate vote groups:', duplicates.length);
}

main()
  .catch((error) => {
    console.error('Database read failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
