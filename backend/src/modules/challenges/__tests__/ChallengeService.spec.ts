/**
 * ChallengeService.spec.ts
 * Unit tests para `ChallengeService` cubriendo recuperación y listado de retos.
 */
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import ChallengeService from '../domain/services/ChallengeService';

describe('ChallengeService (unit)', () => {
  const mockRepo: any = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    listByUser: jest.fn(),
    existsActiveBetween: jest.fn(),
  };
  const service = new ChallengeService(mockRepo);

  beforeEach(() => jest.clearAllMocks());
  /**
   * getChallenge: devuelve `null` cuando el reto no existe
   * - Arrange: `findById` devuelve null
   * - Act: invocar `getChallenge(id)`
   * - Assert: retorna null
   */
  test('getChallenge returns null when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    const res = await service.getChallenge('nope');
    expect(res).toBeNull();
  });

  /**
   * listByUser: lista retos asociados a un usuario
   * - Arrange: `listByUser` del repo devuelve un arreglo con retos
   * - Act: invocar `listByUser(userId)`
   * - Assert: resultado es un array con la longitud esperada
   */
  test('listByUser returns array', async () => {
    mockRepo.listByUser.mockResolvedValue([{ id: 'ch1' }]);
    const res = await service.listByUser('u1');
    expect(res.length).toBe(1);
  });
});
