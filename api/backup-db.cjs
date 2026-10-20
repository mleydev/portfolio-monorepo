const { Client } = require('pg');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing from .env');
  }

  // Verify the database connection before creating the backup.
  const client = new Client({ connectionString });

  await client.connect();
  await client.query('SELECT 1');
  await client.end();

  const outputPath = path.resolve('portfolio-backup.dump');
  const pgDumpPath =
    'C:\\Program Files\\PostgreSQL\\18\\pgAdmin 4\\runtime\\pg_dump.exe';

  const output = fs.createWriteStream(outputPath, { flags: 'wx' });

  const dump = spawn(
    pgDumpPath,
    ['--dbname', connectionString, '--format=custom'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  let errorOutput = '';

  dump.stderr.on('data', (chunk) => {
    errorOutput += chunk.toString();
  });

  dump.stdout.pipe(output);

  dump.on('error', (error) => {
    output.destroy();
    console.error('Backup process failed:', error.message);
  });

  dump.on('close', (code) => {
    output.end();

    if (code !== 0) {
      fs.rmSync(outputPath, { force: true });
      console.error(
        'Backup failed. Check database access and pg_dump compatibility.',
      );
      if (errorOutput) console.error(errorOutput);
      process.exitCode = 1;
      return;
    }

    console.log('Backup process completed:', outputPath);
    console.log('Verify the file size before proceeding.');
  });
}

main().catch((error) => {
  console.error('Backup failed:', error.message);
  process.exitCode = 1;
});
