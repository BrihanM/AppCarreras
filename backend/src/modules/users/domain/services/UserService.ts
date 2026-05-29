import IUserRepository from '../ports/IUserRepository';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';
import { getIo } from '../../../../socket';

/**
 * Servicio de dominio para `User`.
 * - Encapsula operaciones CRUD sobre usuarios.
 * - Emite eventos globales (`user:created`, `user:updated`, `user:deleted`).
 */
class UserService {
  private repo: IUserRepository;

  constructor(repo: IUserRepository) {
    this.repo = repo;
  }

  /**
   * createUser
   * Crea un usuario y emite evento `user:created`.
   * @param {Partial<User>} attrs - Atributos del usuario.
   * @returns {Promise<User>} Usuario creado.
   */
  async createUser(attrs: Partial<User>): Promise<User> {
    const id = attrs.id || uuidv4();
    // Enforce: an account_id can only be associated to one user
    if ((attrs as any).account_id) {
      const existing = await (this.repo as any).findByAccountId((attrs as any).account_id);
      if (existing) throw new Error('Account already has an associated user');
    }
    const user = await this.repo.create({ ...attrs, id } as any);
    try {
      const io = getIo();
      if (io) io.emit('user:created', user);
    } catch (e) {}
    return user;
  }

  /**
   * getUser
   * Recupera un usuario por id.
   * @param {string} id - Identificador del usuario.
   * @returns {Promise<User|null>} Usuario o null.
   */
  async getUser(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  /**
   * getByAccountId
   * Recupera un `User` por el `account_id` (id de la cuenta/auth).
   */
  async getByAccountId(accountId: string): Promise<User | null> {
    // delega al repositorio
    if (typeof (this.repo as any).findByAccountId === 'function') {
      return (this.repo as any).findByAccountId(accountId);
    }
    return null;
  }

  /**
   * updateUser
   * Actualiza un usuario y emite `user:updated`.
   * @param {string} id - Identificador.
   * @param {Partial<User>} attrs - Campos a actualizar.
   * @returns {Promise<User>} Usuario actualizado.
   */
  async updateUser(id: string, attrs: Partial<User>): Promise<User> {
    const updated = await this.repo.update(id, attrs);
    try { const io = getIo(); if (io) io.emit('user:updated', updated); } catch (e) {}
    return updated;
  }

  /**
   * deleteUser
   * Elimina un usuario y emite `user:deleted`.
   * @param {string} id - Identificador del usuario.
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.repo.findById(id);
    await this.repo.delete(id);
    try { const io = getIo(); if (io && user) io.emit('user:deleted', user); } catch (e) {}
    return;
  }

  /**
   * listUsers
   * Lista todos los usuarios.
   * @returns {Promise<User[]>} Array de usuarios.
   */
  async listUsers(): Promise<User[]> {
    return this.repo.findAll();
  }
}

export default UserService;
