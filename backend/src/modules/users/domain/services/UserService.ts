import IUserRepository from '../ports/IUserRepository';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';

class UserService {
  private repo: IUserRepository;

  constructor(repo: IUserRepository) {
    this.repo = repo;
  }

  async createUser(attrs: Partial<User>): Promise<User> {
    const id = attrs.id || uuidv4();
    const user = await this.repo.create({ ...attrs, id } as any);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  async updateUser(id: string, attrs: Partial<User>): Promise<User> {
    return this.repo.update(id, attrs);
  }

  async deleteUser(id: string): Promise<void> {
    return this.repo.delete(id);
  }

  async listUsers(): Promise<User[]> {
    return this.repo.findAll();
  }
}

export default UserService;
