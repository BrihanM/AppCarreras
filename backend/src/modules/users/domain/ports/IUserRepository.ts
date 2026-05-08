import { User } from '../entities/User';

export default interface IUserRepository {
  create(user: Partial<User>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByAccountId(accountId: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, attrs: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
