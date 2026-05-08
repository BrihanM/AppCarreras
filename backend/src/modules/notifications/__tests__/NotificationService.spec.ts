/**
 * NotificationService.spec.ts
 * Unit tests para `NotificationService` incluyendo creación y marcado como leído.
 */
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import NotificationService from '../domain/services/NotificationService';

describe('NotificationService (unit)', () => {
  const mockRepo: any = {
    create: jest.fn(),
    listByUser: jest.fn(),
    markRead: jest.fn(),
    findById: jest.fn(),
  };
  const service = new NotificationService(mockRepo);

  beforeEach(() => jest.clearAllMocks());

  test('createNotification persists and returns', async () => {
    mockRepo.create.mockResolvedValue({ id: 'n1', user_id: 'u1', message: 'hi' });
    const res = await service.createNotification({ user_id: 'u1', message: 'hi' } as any);
    expect(res.id).toBe('n1');
    expect(mockRepo.create).toHaveBeenCalled();
  });

  /**
   * markAsRead: marca una notificación como leída
   * - Arrange: `markRead` del repo devuelve la notificación con `is_read: true`
   * - Act: llamar `markAsRead(id)`
   * - Assert: repo.markRead fue invocado y el resultado tiene `is_read: true`
   */
  test('markAsRead calls repo.markRead and returns notification', async () => {
    mockRepo.markRead.mockResolvedValue({ id: 'n1', is_read: true });
    const res = await service.markAsRead('n1');
    expect(mockRepo.markRead).toHaveBeenCalledWith('n1');
    expect(res.is_read).toBe(true);
  });
});
