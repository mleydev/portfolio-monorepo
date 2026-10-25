const { PrismaClient } = require('./generated/prisma/client');

const prisma = new PrismaClient();

async function main() {
  const totalVotes = await prisma.pollVote.count();

  const votes = await prisma.pollVote.findMany({
    select: {
      pollId: true,
      voterKey: true,
      optionId: true,
    },
  });

  const ballots = new Set(
    votes.map((vote) => JSON.stringify([vote.pollId, vote.voterKey])),
  );

  const groups = new Map();

  for (const vote of votes) {
    const key = JSON.stringify([vote.pollId, vote.voterKey, vote.optionId]);

    groups.set(key, (groups.get(key) ?? 0) + 1);
  }

  const duplicates = [...groups.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({
      pollId: JSON.parse(key)[0],
      optionId: JSON.parse(key)[2],
      count,
    }));

  console.log('\n--- Poll vote report ---');
  console.log('Total votes:', totalVotes);
  console.log('Existing ballots:', ballots.size);
  console.log('Duplicate vote groups:', duplicates.length);

  if (duplicates.length > 0) {
    console.log('Duplicates:', duplicates);
  }
}

main()
  .catch((error) => {
    console.error('Database read failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
