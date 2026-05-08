/**
 * CategoryService.spec.ts
 * Unit tests para `CategoryService` cubriendo creación y actualización.
 */
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import CategoryService from '../domain/services/CategoryService';

describe('CategoryService (unit)', () => {
  const mockRepo: any = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = new CategoryService(mockRepo);

  beforeEach(() => jest.clearAllMocks());

  test('createCategory returns created', async () => {
    mockRepo.create.mockResolvedValue({ id: 'c1', name: 'cat' });
    const res = await service.createCategory({ name: 'cat' } as any);
    expect(res.id).toBe('c1');
  });

  /**
   * updateCategory: actualiza una categoría existente
   * - Arrange: repo.update resuelve con la categoría modificada
   * - Act: invocar `updateCategory(id, data)`
   * - Assert: repo.update recibió los argumentos correctos y retorna la categoría actualizada
   */
  test('updateCategory calls repo.update and returns updated', async () => {
    mockRepo.update.mockResolvedValue({ id: 'c1', name: 'cat-upd' });
    const res = await service.updateCategory('c1', { name: 'cat-upd' } as any);
    expect(mockRepo.update).toHaveBeenCalledWith('c1', { name: 'cat-upd' });
    expect(res.name).toBe('cat-upd');
  });
});
