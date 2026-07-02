/**
 * Run-scoped render DB provisioning (DESIGN §13.2).
 *
 * Each run gets an ISOLATED database on the Postgres server (never the shared
 * dev DB), seeded with only the template under evolution. SQL is run through an
 * injected executor so sitc-core stays free of a pg driver dependency and so the
 * orchestrator controls which server/credentials are used (portability, §13.1).
 *
 * NOT exercised against production here — `CREATE/DROP DATABASE` is gated on an
 * explicit operator run.
 */
export interface SqlExec {
  /** Execute a raw SQL statement against the admin database. */
  query(sql: string): Promise<unknown>;
}

export function runDbName(runId: string | number): string {
  return `sitc_run_${runId}`;
}

/** Derive the run DB connection URL from an admin URL (swaps the database name). */
export function runDbUrl(adminUrl: string, runId: string | number): string {
  const u = new URL(adminUrl);
  u.pathname = `/${runDbName(runId)}`;
  return u.toString();
}

export async function provisionRunDb(admin: SqlExec, runId: string | number): Promise<string> {
  const name = runDbName(runId);
  // CREATE DATABASE cannot run inside a transaction; the executor must autocommit.
  await admin.query(`CREATE DATABASE "${name}"`);
  return name;
}

export async function dropRunDb(admin: SqlExec, runId: string | number): Promise<void> {
  const name = runDbName(runId);
  // Terminate stragglers first, then drop. IF EXISTS keeps teardown idempotent.
  await admin.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${name}' AND pid <> pg_backend_pid()`,
  );
  await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
}
