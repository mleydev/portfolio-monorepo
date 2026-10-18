import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createInterface } from 'node:readline/promises';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const email = (await readline.question('Admin email: '))
      .trim()
      .toLowerCase();

    const fullName = (await readline.question('Admin full name: ')).trim();

    const password = await readline.question('Admin password: ');

    if (!email || !fullName || password.length < 12) {
      throw new Error(
        'Email and full name are required; password must be at least 12 characters.',
      );
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    const prisma = new PrismaClient({ adapter });

    try {
      const passwordHash = await hash(password, 12);

      // Upsert makes the script safe to run more than once.
      await prisma.adminUser.upsert({
        where: { email },
        update: {
          fullName,
          passwordHash,
          active: true,
        },
        create: {
          email,
          fullName,
          passwordHash,
          active: true,
        },
      });

      console.log('Admin account created or updated successfully.');
    } finally {
      await prisma.$disconnect();
    }
  } finally {
    readline.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
