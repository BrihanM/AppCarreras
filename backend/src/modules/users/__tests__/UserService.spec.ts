/**
 * UserService.spec.ts
 * Unit tests para `UserService` comprobando creación, recuperación y actualización.
 */
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import UserService from '../domain/services/UserService';

describe('UserService (unit)', () => {
  const mockRepo: any = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  };
  const service = new UserService(mockRepo);

  beforeEach(() => jest.clearAllMocks());

  test('createUser calls repo.create and returns user', async () => {
    mockRepo.create.mockResolvedValue({ id: 'u1', name: 'test' });
    const res = await service.createUser({ name: 'test' } as any);
    expect(res).toEqual({ id: 'u1', name: 'test' });
    expect(mockRepo.create).toHaveBeenCalled();
  });

  test('getUser returns null when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    const res = await service.getUser('nope');
    expect(res).toBeNull();
  });

  /**
   * updateUser: actualiza un usuario existente
   * - Arrange: `update` del repo resuelve con el objeto actualizado
   * - Act: invocar `updateUser` con cambios
   * - Assert: repo.update fue llamado con los argumentos correctos y retorna el actualizado
   */
  test('updateUser calls repo.update and returns updated', async () => {
    mockRepo.update.mockResolvedValue({ id: 'u1', name: 'updated' });
    const res = await service.updateUser('u1', { name: 'updated' } as any);
    expect(mockRepo.update).toHaveBeenCalledWith('u1', { name: 'updated' });
    expect(res).toEqual({ id: 'u1', name: 'updated' });
  });
});
