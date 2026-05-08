import IAccountRepository from '../ports/IAccountRepository';
import IUserRepository from '../ports/IUserRepository';
import { Account } from '../entities/Account';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

class AuthService {
  private accountRepo: IAccountRepository;
  private userRepo: IUserRepository | null;

  constructor(accountRepo: IAccountRepository, userRepo: IUserRepository | null) {
    this.accountRepo = accountRepo;
    this.userRepo = userRepo;
  }

  async createAccount(attrs: Partial<Account> & { password?: string }): Promise<Account> {
    const username = attrs.username;
    const email = attrs.email;
    if (!attrs.password) throw new Error('Password is required');

    // uniqueness checks
    if (username) {
      const existing = await this.accountRepo.findByUsername(username);
      if (existing) throw new Error('Username already exists');
    }
    if (email) {
      const existingEmail = await this.accountRepo.findByEmail(email);
      if (existingEmail) throw new Error('Email already exists');
    }

    const hashed = await bcrypt.hash(attrs.password, 10);
    const id = attrs.id || uuidv4();
    const account = await this.accountRepo.create({ ...attrs, id, password_hash: hashed } as any);
    return account;
  }

  async getAccount(id: string): Promise<Account | null> {
    return this.accountRepo.findById(id);
  }

  async updateAccount(id: string, attrs: Partial<Account>): Promise<Account> {
    if ((attrs as any).password) {
      (attrs as any).password_hash = await bcrypt.hash((attrs as any).password, 10);
    }
    return this.accountRepo.update(id, attrs as any);
  }

  async deleteAccount(id: string): Promise<void> {
    return this.accountRepo.delete(id);
  }

  // User operations
  async createUser(attrs: Partial<User>): Promise<User> {
    if (!this.userRepo) throw new Error('User repository not configured');
    const id = attrs.id || uuidv4();
    const user = await this.userRepo.create({ ...attrs, id } as any);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.userRepo) throw new Error('User repository not configured');
    return this.userRepo.findById(id);
  }

  async updateUser(id: string, attrs: Partial<User>): Promise<User> {
    if (!this.userRepo) throw new Error('User repository not configured');
    return this.userRepo.update(id, attrs as any);
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.userRepo) throw new Error('User repository not configured');
    return this.userRepo.delete(id);
  }

  async authenticate(identifier: string, password: string): Promise<Account> {
    const byUsername = await this.accountRepo.findByUsername(identifier);
    const account = byUsername || await this.accountRepo.findByEmail(identifier);
    if (!account) throw new Error('Invalid credentials');
    const match = await bcrypt.compare(password, account.password_hash);
    if (!match) throw new Error('Invalid credentials');
    return account;
  }
}

export default AuthService;
