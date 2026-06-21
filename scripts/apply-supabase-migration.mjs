/**
 * Supabase migration SQL 적용 (원격 Postgres 직접 연결)
 *
 * 환경 (.env.local):
 *   VITE_SUPABASE_URL
 *   SUPABASE_DB_PASSWORD  — Dashboard → Project Settings → Database → Database password
 *
 * 사용:
 *   npm run db:apply-migrations
 *   npm run db:apply-migrations -- supabase/migrations/20260621120000_airports.sql
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { loadEnvFile, SCRIPT_ROOT } from './lib/load-env-file.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MIGRATION = join(SCRIPT_ROOT, 'supabase/migrations/20260621120000_airports.sql');

function projectRefFromUrl(url) {
  const match = String(url || '').match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? '';
}

function migrationPathsFromArgs() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (args.length === 0) return [DEFAULT_MIGRATION];
  return args.map((p) => resolve(SCRIPT_ROOT, p));
}

async function main() {
  loadEnvFile();
  const url = process.env.VITE_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = projectRefFromUrl(url);

  if (!ref) {
    console.error('VITE_SUPABASE_URL이 없거나 project ref를 파싱할 수 없습니다.');
    process.exit(1);
  }
  if (!password) {
    console.error(
      'SUPABASE_DB_PASSWORD가 필요합니다.\n'
      + 'Supabase Dashboard → Project Settings → Database → Database password\n'
      + '.env.local에 SUPABASE_DB_PASSWORD=... 추가 후 다시 실행하세요.'
    );
    process.exit(1);
  }

  const paths = migrationPathsFromArgs();
  for (const path of paths) {
    if (!existsSync(path)) {
      console.error(`Migration file not found: ${path}`);
      process.exit(1);
    }
  }

  const client = new pg.Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(`Connected to db.${ref}.supabase.co`);

  for (const path of paths) {
    const sql = readFileSync(path, 'utf8');
    console.log(`Applying: ${path}`);
    await client.query(sql);
    console.log('  OK');
  }

  const { rows } = await client.query(
    "SELECT to_regclass('public.airports') AS airports_table"
  );
  console.log('Verify airports table:', rows[0]?.airports_table ?? 'missing');

  await client.end();
  console.log('Migration apply complete.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
