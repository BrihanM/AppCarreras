import IUserRepository from '../ports/IUserRepository';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';
import { getIo } from '../../../../socket';

class UserService {
  private repo: IUserRepository;

  constructor(repo: IUserRepository) {
    this.repo = repo;
  }

  async createUser(attrs: Partial<User>): Promise<User> {
    const id = attrs.id || uuidv4();
    const user = await this.repo.create({ ...attrs, id } as any);
    try {
      const io = getIo();
      if (io) io.emit('user:created', user);
    } catch (e) {}
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  async updateUser(id: string, attrs: Partial<User>): Promise<User> {
    const updated = await this.repo.update(id, attrs);
    try { const io = getIo(); if (io) io.emit('user:updated', updated); } catch (e) {}
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.repo.findById(id);
    await this.repo.delete(id);
    try { const io = getIo(); if (io && user) io.emit('user:deleted', user); } catch (e) {}
    return;
  }

  async listUsers(): Promise<User[]> {
    return this.repo.findAll();
  }
}

export default UserService;
