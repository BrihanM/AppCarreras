import IAccountRepository from '../../../domain/ports/IAccountRepository';
import { Account } from '../../../domain/entities/Account';
import { pool } from '../../db';

class AccountRepositoryPg implements IAccountRepository {
  async create(account: Partial<Account>): Promise<Account> {
    const q = `INSERT INTO accounts (id, username, email, password_hash, photo, last_connection)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const values = [account.id, account.username, account.email, account.password_hash, account.photo || null, account.last_connection || null];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async findById(id: string): Promise<Account | null> {
    const { rows } = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findByUsername(username: string): Promise<Account | null> {
    const { rows } = await pool.query('SELECT * FROM accounts WHERE username = $1', [username]);
    return rows[0] || null;
  }

  async findByEmail(email: string): Promise<Account | null> {
    const { rows } = await pool.query('SELECT * FROM accounts WHERE email = $1', [email]);
    return rows[0] || null;
  }

  async update(id: string, attrs: Partial<Account>): Promise<Account> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Account not found');
    const updated = { ...existing, ...attrs } as any;
    const q = `UPDATE accounts SET username=$1,email=$2,password_hash=$3,photo=$4,last_connection=$5,updated_at=NOW() WHERE id=$6 RETURNING *`;
    const values = [updated.username, updated.email, updated.password_hash, updated.photo, updated.last_connection, id];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
  }
}

export default AccountRepositoryPg;
