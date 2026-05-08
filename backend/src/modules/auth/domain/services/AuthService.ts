import IAccountRepository from '../ports/IAccountRepository';
import IUserRepository from '../ports/IUserRepository';
import { Account } from '../entities/Account';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getIo } from '../../../../socket';

/**
 * Servicio de dominio para autenticación y gestión de cuentas/usuarios.
 * - Gestiona cuentas (`Account`) y operaciones relacionadas con `User` cuando
 *   el repositorio de usuarios está disponible.
 * - Aplica validaciones básicas (unicidad, hashing) y emite eventos WebSocket.
 */
class AuthService {
  private accountRepo: IAccountRepository;
  private userRepo: IUserRepository | null;

  constructor(accountRepo: IAccountRepository, userRepo: IUserRepository | null) {
    this.accountRepo = accountRepo;
    this.userRepo = userRepo;
  }

  /**
   * createAccount
   * Crea una nueva cuenta (account).
   * - Valida que `password` esté presente.
   * - Verifica unicidad de `username` y `email` cuando se proporcionan.
   * - Hashea la contraseña antes de persistir.
   * - Emite `account:created` vía WebSocket.
   *
   * @param {Partial<Account> & { password?: string }} attrs - Atributos de la cuenta.
   * @returns {Promise<Account>} Cuenta creada.
   */
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
    try { const io = getIo(); if (io) io.emit('account:created', account); } catch (e) {}
    return account;
  }

  /**
   * getAccount
   * Recupera una cuenta por su identificador.
   * @param {string} id - Identificador de la cuenta.
   * @returns {Promise<Account|null>} Cuenta o null si no existe.
   */
  async getAccount(id: string): Promise<Account | null> {
    return this.accountRepo.findById(id);
  }

  /**
   * updateAccount
   * Actualiza una cuenta. Si se envía `password`, la hashea antes de guardar.
   * Emite `account:updated` al finalizar.
   *
   * @param {string} id - Identificador de la cuenta.
   * @param {Partial<Account>} attrs - Campos a actualizar.
   * @returns {Promise<Account>} Cuenta actualizada.
   */
  async updateAccount(id: string, attrs: Partial<Account>): Promise<Account> {
    if ((attrs as any).password) {
      (attrs as any).password_hash = await bcrypt.hash((attrs as any).password, 10);
    }
    const updated = await this.accountRepo.update(id, attrs as any);
    try { const io = getIo(); if (io) io.emit('account:updated', updated); } catch (e) {}
    return updated;
  }

  /**
   * deleteAccount
   * Elimina una cuenta y emite `account:deleted`.
   * @param {string} id - Identificador de la cuenta a eliminar.
   */
  async deleteAccount(id: string): Promise<void> {
    const acc = await this.accountRepo.findById(id);
    await this.accountRepo.delete(id);
    try { const io = getIo(); if (io && acc) io.emit('account:deleted', acc); } catch (e) {}
    return;
  }

  // User operations
  /**
   * createUser
   * Crea un usuario relacionado y emite `user:created`.
   * Requiere que `userRepo` esté configurado.
   * @param {Partial<User>} attrs - Atributos del usuario.
   * @returns {Promise<User>} Usuario creado.
   */
  async createUser(attrs: Partial<User>): Promise<User> {
    if (!this.userRepo) throw new Error('User repository not configured');
    const id = attrs.id || uuidv4();
    const user = await this.userRepo.create({ ...attrs, id } as any);
    try { const io = getIo(); if (io) io.emit('user:created', user); } catch (e) {}
    return user;
  }

  /**
   * getUser
   * Recupera un usuario por id usando el `userRepo` configurado.
   * @param {string} id - Identificador del usuario.
   * @returns {Promise<User|null>} Usuario o null.
   */
  async getUser(id: string): Promise<User | null> {
    if (!this.userRepo) throw new Error('User repository not configured');
    return this.userRepo.findById(id);
  }

  /**
   * updateUser
   * Actualiza un usuario y emite `user:updated`.
   * @param {string} id - Identificador del usuario.
   * @param {Partial<User>} attrs - Campos a actualizar.
   * @returns {Promise<User>} Usuario actualizado.
   */
  async updateUser(id: string, attrs: Partial<User>): Promise<User> {
    if (!this.userRepo) throw new Error('User repository not configured');
    const updated = await this.userRepo.update(id, attrs as any);
    try { const io = getIo(); if (io) io.emit('user:updated', updated); } catch (e) {}
    return updated;
  }

  /**
   * deleteUser
   * Elimina un usuario y emite `user:deleted`.
   * @param {string} id - Identificador del usuario.
   */
  async deleteUser(id: string): Promise<void> {
    if (!this.userRepo) throw new Error('User repository not configured');
    const user = await this.userRepo.findById(id);
    await this.userRepo.delete(id);
    try { const io = getIo(); if (io && user) io.emit('user:deleted', user); } catch (e) {}
    return;
  }

  /**
   * authenticate
   * Verifica credenciales a partir de `identifier` (username o email) y contraseña.
   * - Busca por username, si no existe busca por email.
   * - Compara la contraseña con `password_hash`.
   *
   * @param {string} identifier - Username o email.
   * @param {string} password - Contraseña en texto plano.
   * @returns {Promise<Account>} Cuenta autenticada.
   */
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
