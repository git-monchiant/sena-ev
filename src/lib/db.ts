import "server-only";
import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __sena_ev_pgpool: Pool | undefined;
}

function buildConfig(): PoolConfig {
  const url = process.env.DATABASE_URL;
  if (url) {
    return {
      connectionString: url,
      max: Number(process.env.DB_POOL_SIZE ?? 10),
    };
  }
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: Number(process.env.DB_POOL_SIZE ?? 10),
  };
}

function getPool(): Pool {
  if (!global.__sena_ev_pgpool) {
    global.__sena_ev_pgpool = new Pool(buildConfig());
  }
  return global.__sena_ev_pgpool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
