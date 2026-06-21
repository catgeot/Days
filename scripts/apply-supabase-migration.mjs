/**
 * Supabase migration SQL 적용 (원격 Postgres 직접 연결)
 *
 * 환경 (.env.local):
 *   VITE_SUPABASE_URL
 *   SUPABASE_DB_PASSWORD  — Dashboard → Project Settings → Database → Database password
 *   SUPABASE_DB_POOLER_HOST — (선택) IPv4 pooler, 예: aws-1-ap-northeast-2.pooler.supabase.com
 *   SUPABASE_DB_CONNECTION_STRING — (선택) Connect 페이지 Session URI 전체
 *
 * 사용:
 *   npm run db:apply-migrations
 *   npm run db:apply-migrations -- supabase/migrations/20260621120000_airports.sql
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile, SCRIPT_ROOT } from './lib/load-env-file.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MIGRATION = join(SCRIPT_ROOT, 'supabase/migrations/20260621120000_airports.sql');

function projectRefFromUrl(url) {
  const match = String(url || '').match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? '';
}

/** @returns {import('pg').ClientConfig} */
function buildDirectClientConfig(ref, password) {
  return {
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000,
  };
}

/** Session pooler — IPv4 (Supavisor). user must be postgres.{project-ref} */
function buildPoolerClientConfig(ref, password, poolerHost) {
  return {
    host: poolerHost,
    port: Number(process.env.SUPABASE_DB_POOLER_PORT || 5432),
    user: process.env.SUPABASE_DB_POOLER_USER || `postgres.${ref}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000,
  };
}

function poolerHostCandidates(ref) {
  const fromEnv = String(process.env.SUPABASE_DB_POOLER_HOST || '').trim();
  const region = String(process.env.SUPABASE_DB_REGION || 'ap-northeast-2').trim();
  const hosts = [];
  if (fromEnv) hosts.push(fromEnv);
  for (const prefix of ['aws-1', 'aws-0']) {
    hosts.push(`${prefix}-${region}.pooler.supabase.com`);
  }
  for (const prefix of ['aws-1', 'aws-0']) {
    for (const r of ['ap-northeast-1', 'ap-southeast-1', 'us-east-1']) {
      hosts.push(`${prefix}-${r}.pooler.supabase.com`);
    }
  }
  return [...new Set(hosts)];
}

function isIpv4UnreachableError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('enotfound')
    || msg.includes('enetunreach')
    || msg.includes('econnrefused')
    || msg.includes('network is unreachable')
    || msg.includes('getaddrinfo')
  );
}

/**
 * @param {string} ref
 * @param {string} password
 * @returns {Promise<{ client: import('pg').Client, label: string }>}
 */
async function connectPostgres(ref, password) {
  const pg = (await import('pg')).default;

  const connectionString = String(process.env.SUPABASE_DB_CONNECTION_STRING || '').trim();
  if (connectionString) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 12000,
    });
    await client.connect();
    return { client, label: 'SUPABASE_DB_CONNECTION_STRING' };
  }

  const poolerHost = String(process.env.SUPABASE_DB_POOLER_HOST || '').trim();
  if (poolerHost) {
    const client = new pg.Client(buildPoolerClientConfig(ref, password, poolerHost));
    await client.connect();
    return { client, label: `pooler ${poolerHost}` };
  }

  const direct = new pg.Client(buildDirectClientConfig(ref, password));
  try {
    await direct.connect();
    return { client: direct, label: `direct db.${ref}.supabase.co` };
  } catch (err) {
    await direct.end().catch(() => {});
    if (!isIpv4UnreachableError(err)) throw err;

    console.warn(
      `Direct DB host unreachable (IPv6-only on many networks): db.${ref}.supabase.co\n`
      + 'Trying Supavisor pooler (IPv4)...'
    );

    const errors = [];
    for (const host of poolerHostCandidates(ref)) {
      const client = new pg.Client(buildPoolerClientConfig(ref, password, host));
      try {
        await client.connect();
        console.log(`Connected via pooler: ${host}`);
        return { client, label: `pooler ${host}` };
      } catch (poolErr) {
        errors.push(`${host}: ${poolErr.message}`);
        await client.end().catch(() => {});
      }
    }

    throw new Error(
      `Postgres connection failed.\n`
      + `Direct: ${err.message}\n`
      + `Pooler attempts:\n  - ${errors.slice(0, 6).join('\n  - ')}\n\n`
      + 'Dashboard → Connect → Session pooler URI를 .env.local에 추가하세요:\n'
      + '  SUPABASE_DB_POOLER_HOST=aws-1-ap-northeast-2.pooler.supabase.com\n'
      + '(또는 SUPABASE_DB_CONNECTION_STRING=postgresql://...)'
    );
  }
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

  const client = (await connectPostgres(ref, password)).client;
  console.log('Postgres connected.');

  try {
    for (const path of paths) {
      const sql = readFileSync(path, 'utf8');
      console.log(`Applying: ${path}`);
      await client.query(sql);
      console.log('  OK');
    }

    const { rows } = await client.query(
      "SELECT to_regclass('public.airports') AS airports_table, to_regclass('public.air_routes') AS air_routes_table"
    );
    console.log('Verify airports table:', rows[0]?.airports_table ?? 'missing');
    console.log('Verify air_routes table:', rows[0]?.air_routes_table ?? 'missing');
  } finally {
    await client.end();
  }

  console.log('Migration apply complete.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
