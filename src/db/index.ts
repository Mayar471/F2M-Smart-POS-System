import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';

const DB_PATH = process.env.DATABASE_URL ?? path.join(process.cwd(), 'f2m.db');

// Singleton pattern: reuse connection across hot-reloads in dev
const globalForDb = globalThis as unknown as { _db: ReturnType<typeof drizzle> | undefined };

function createDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  // Run migrations synchronously on startup
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'src/db/migrations') });
  return db;
}

export const db = globalForDb._db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb._db = db;
}

export type DB = typeof db;