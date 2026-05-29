import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function runSeed(): Promise<void> {
  const file = path.resolve(__dirname, '..', '..', 'db', 'init_and_seed.sql');
  const sql = await fs.promises.readFile(file, 'utf8');
  if (!sql.trim()) {
    console.log('No seed SQL found');
    return;
  }

  try {
    console.log('Running seed SQL from', file);
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    console.log('Seed applied successfully');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Seed failed', err);
    throw err;
  }
}

if (require.main === module) {
  runSeed().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default runSeed;
