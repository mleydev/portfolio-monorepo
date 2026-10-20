const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Check whether the columns already exist.
    const result = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'Project' AND column_name = 'publishedAt')
          OR
          (table_name = 'ProjectTranslation' AND column_name IN (
            'summary',
            'role',
            'metaTitle',
            'metaDescription'
          ))
        )
      ORDER BY table_name, column_name;
    `);

    const existing = new Set(
      result.rows.map((row) => `${row.table_name}.${row.column_name}`),
    );

    const changes = [
      {
        table: 'Project',
        column: 'publishedAt',
        sql: 'ALTER TABLE "Project" ADD COLUMN "publishedAt" TIMESTAMP(3)',
      },
      {
        table: 'ProjectTranslation',
        column: 'summary',
        sql: 'ALTER TABLE "ProjectTranslation" ADD COLUMN "summary" TEXT',
      },
      {
        table: 'ProjectTranslation',
        column: 'role',
        sql: 'ALTER TABLE "ProjectTranslation" ADD COLUMN "role" TEXT',
      },
      {
        table: 'ProjectTranslation',
        column: 'metaTitle',
        sql: 'ALTER TABLE "ProjectTranslation" ADD COLUMN "metaTitle" TEXT',
      },
      {
        table: 'ProjectTranslation',
        column: 'metaDescription',
        sql: 'ALTER TABLE "ProjectTranslation" ADD COLUMN "metaDescription" TEXT',
      },
    ];

    for (const change of changes) {
      const key = `${change.table}.${change.column}`;

      if (existing.has(key)) {
        console.log(`Already exists: ${key}`);
        continue;
      }

      await client.query(change.sql);
      console.log(`Added: ${key}`);
    }

    console.log('Schema update finished.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Schema update failed:', error.message);
  process.exitCode = 1;
});
