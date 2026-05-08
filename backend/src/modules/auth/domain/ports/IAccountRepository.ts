import { Account } from '../../domain/entities/Account';

export default interface IAccountRepository {
  create(account: Partial<Account>): Promise<Account>;
  findById(id: string): Promise<Account | null>;
  findByUsername(username: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  update(id: string, attrs: Partial<Account>): Promise<Account>;
  delete(id: string): Promise<void>;
}
