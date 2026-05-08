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

async function run() {
  try {
    const root = path.resolve(__dirname, '..', 'modules');
    const files = await findSqlFiles(root);
    files.sort();
    console.log('Found migration files:', files);
    for (const file of files) {
      const sql = await fs.promises.readFile(file, 'utf8');
      if (!sql.trim()) continue;
      console.log('Applying', file);
      await pool.query(sql);
    }
    console.log('Migrations applied');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

run();
