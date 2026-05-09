// Mock uuid to avoid ESM parsing issues in test environment
/**
 * AuthService.spec.ts
 * Tests unitarios para `AuthService`.
 * - Casos de error: credenciales inválidas, refresh token inválido/propio.
 * - Casos correctos: authenticate válido, creación/rotación/revocación de refresh tokens.
 */
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import bcrypt from 'bcrypt';
import AuthService from '../domain/services/AuthService';

describe('AuthService (unit)', () => {
  const mockAccountRepo: any = {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const mockRefreshRepo: any = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    markReplaced: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };

  const service = new AuthService(mockAccountRepo, null, mockRefreshRepo);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * authenticate: error cuando no existe cuenta
   *
   * Arrange: los repositorios devuelven `null` para username/email.
   * Act: llamar a `authenticate` con credenciales inexistentes.
   * Assert: se lanza `Invalid credentials`.
   */
  test('authenticate should throw on missing account', async () => {
    mockAccountRepo.findByUsername.mockResolvedValue(null);
    mockAccountRepo.findByEmail.mockResolvedValue(null);
    await expect(service.authenticate('nope', 'pwd')).rejects.toThrow('Invalid credentials');
  });

  /**
   * authenticate: éxito cuando la contraseña coincide
   *
   * Arrange: existe una cuenta y `bcrypt.compare` devuelve `true`.
   * Act: llamar a `authenticate` con credenciales válidas.
   * Assert: devuelve el objeto `account` encontrado.
   */
  test('authenticate succeeds with correct password', async () => {
    const account = { id: 'a1', username: 'u', password_hash: 'hash' };
    mockAccountRepo.findByUsername.mockResolvedValue(account);
    // mock bcrypt.compare para evitar hashing real
    (bcrypt as any).compare = jest.fn().mockResolvedValue(true);
    const res = await service.authenticate('u', 'Password123');
    expect(res).toBe(account);
  });

  /**
   * createRefreshToken: genera token y persiste hash
   *
   * Arrange: el repositorio de refresh tokens está preparado para persistir.
   * Act: llamar a `createRefreshToken(userId)`.
   * Assert: retorna un objeto con `token` y `expiresAt`, y el repo fue llamado.
   */
  test('createRefreshToken should create token and return token and expiry', async () => {
    mockRefreshRepo.create.mockResolvedValue({ id: '1' });
    const res = await service.createRefreshToken('user-1');
    expect(res).toHaveProperty('token');
    expect(res).toHaveProperty('expiresAt');
    expect(mockRefreshRepo.create).toHaveBeenCalled();
  });

  /**
   * rotateRefreshToken: error cuando token desconocido
   *
   * Arrange: el repo no encuentra el hash del token proporcionado.
   * Act/Assert: llamar a `rotateRefreshToken` y esperar excepción `Invalid refresh token`.
   */
  test('rotateRefreshToken rejects invalid token', async () => {
    mockRefreshRepo.findByTokenHash.mockResolvedValue(undefined);
    await expect(service.rotateRefreshToken('invalid')).rejects.toThrow('Invalid refresh token');
  });

  /**
   * rotateRefreshToken: éxito y marca replaced
   *
   * Arrange: existe un refresh token válido en el repo.
   * Act: invocar `rotateRefreshToken` con el token antiguo.
   * Assert: devuelve nuevo token, mantiene `userId` y llama a `markReplaced`.
   */
  test('rotateRefreshToken succeeds and replaces token', async () => {
    const existing = { id: 'old', user_id: 'u1', revoked_at: null };
    mockRefreshRepo.findByTokenHash.mockResolvedValue(existing);
    mockRefreshRepo.create.mockResolvedValue({ id: 'new' });
    mockRefreshRepo.markReplaced.mockResolvedValue({});
    const out = await service.rotateRefreshToken('valid-old-token');
    expect(out).toHaveProperty('token');
    expect(out.userId).toBe('u1');
    expect(mockRefreshRepo.markReplaced).toHaveBeenCalledWith(existing.id, expect.any(String));
  });

  /**
   * rotateRefreshToken: reuse detection cuando token revocado
   *
   * Arrange: el token encontrado ya tiene `revoked_at` (ya fue usado/revocado).
   * Act/Assert: la rotación debe fallar con 'Refresh token revoked' y
   * debe llamar a `revokeAllForUser` para mitigar reuse.
   */
  test('rotateRefreshToken detects revoked token and revokes all for user', async () => {
    const existing = { id: 'old', user_id: 'u1', revoked_at: new Date().toISOString() };
    mockRefreshRepo.findByTokenHash.mockResolvedValue(existing);
    mockRefreshRepo.revokeAllForUser.mockResolvedValue([]);
    await expect(service.rotateRefreshToken('revoked-token')).rejects.toThrow('Refresh token revoked');
    expect(mockRefreshRepo.revokeAllForUser).toHaveBeenCalledWith(existing.user_id);
  });

  /**
   * revokeRefreshToken: debe llamar a revoke cuando existe
   *
   * Arrange: el repo devuelve un refresh token asociado al hash.
   * Act: llamar a `revokeRefreshToken(token)`.
   * Assert: `revoke` es llamado con la razón 'logout'.
   */
  test('revokeRefreshToken revokes when present', async () => {
    const existing = { id: 'old', user_id: 'u1' };
    mockRefreshRepo.findByTokenHash.mockResolvedValue(existing);
    mockRefreshRepo.revoke.mockResolvedValue({});
    await service.revokeRefreshToken('some-token');
    expect(mockRefreshRepo.revoke).toHaveBeenCalledWith(existing.id, 'logout');
  });
});
