import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function findSqlFiles(dir: string, files: string[] = []) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await findSqlFiles(res, files);
    } else if (entry.isFile() && entry.name.endsWith('.sql')) {
      files.push(res);
    }
  }
  return files;
}

export async function runMigrations(): Promise<void> {
  try {
    const root = path.resolve(__dirname, '..', 'modules');
    const files = await findSqlFiles(root);
    files.sort();
    console.log('Found migration files:', files.length);

    // Ensure migrations table exists to track applied files
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    for (const file of files) {
      const rel = path.relative(root, file).replace(/\\/g, '/');
      const { rows } = await pool.query('SELECT 1 FROM migrations WHERE filename=$1 LIMIT 1', [rel]);
      if (rows.length) {
        console.log('Skipping already applied:', rel);
        continue;
      }
      const sql = await fs.promises.readFile(file, 'utf8');
      if (!sql.trim()) continue;
      console.log('Applying', rel);
      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [rel]);
        await pool.query('COMMIT');
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    }
    console.log('Migrations applied');
  } catch (err) {
    console.error('Migration error', err);
    throw err;
  }
}

// Backwards-compatible CLI: if executed directly, run and exit accordingly.
if (require.main === module) {
  runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
}
