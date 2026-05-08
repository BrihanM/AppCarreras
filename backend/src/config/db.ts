import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * pool
 * Pool de conexiones a PostgreSQL usado por los repositorios.
 * Configurable mediante variables de entorno: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
 */
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/**
 * connectDB
 * Verifica la conexión inicial al pool y termina el proceso si hay error.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected');
    client.release();
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    process.exit(1);
  }
};
