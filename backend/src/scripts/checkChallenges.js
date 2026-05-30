const { Pool } = require('pg');
require('dotenv').config();
(async ()=>{
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  try {
    const ids = ['51111111-1111-4111-8111-511111111111','52222222-2222-4222-9222-522222222222'];
    for (const id of ids) {
      const r = await pool.query('SELECT id,state,winner_id,created_at FROM challenges WHERE id = $1', [id]);
      console.log(id, r.rows);
    }
  } catch (e) {
    console.error('Query error', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
