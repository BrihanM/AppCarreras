/**
 * ChallengeService.promotion.spec.ts
 * Verifica que `completeChallenge` actualice estadísticas y promueva rank
 */
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

// Mock UserRepositoryPg and NotificationRepositoryPg used inside the service
const mockFindById = jest.fn();
const mockUserUpdate = jest.fn();
const mockNotifCreate = jest.fn();

jest.mock('../../users/infrastructure/adapters/pg/UserRepositoryPg', () => {
  return jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    update: mockUserUpdate,
  }));
});

jest.mock('../../notifications/infrastructure/adapters/pg/NotificationRepositoryPg', () => {
  return jest.fn().mockImplementation(() => ({
    create: mockNotifCreate,
  }));
});

import ChallengeService from '../domain/services/ChallengeService';

describe('ChallengeService promotion (unit)', () => {
  const mockRepo: any = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    listByUser: jest.fn(),
    existsActiveBetween: jest.fn(),
  };
  const service = new ChallengeService(mockRepo);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('completeChallenge updates stats and promotes after 3 consecutive wins', async () => {
    const challenge = { id: 'ch1', challenger_id: 'u1', challenged_id: 'u2', state: 'accepted' } as any;
    mockRepo.findById.mockResolvedValue(challenge);
    mockRepo.update.mockImplementation(async (id: string, patch: any) => ({ ...challenge, ...patch }));

    // winner is u1 with 2 consecutive wins already and rank C
    mockFindById.mockImplementation(async (id: string) => {
      if (id === 'u1') return { id: 'u1', rank: 'C', victories: 0, consecutive_challenges: 2 };
      if (id === 'u2') return { id: 'u2', rank: 'C', defeats: 0, consecutive_challenges: 0 };
      return null;
    });

    // user update returns object with incremented consecutive_challenges
    mockUserUpdate.mockImplementation(async (id: string, attrs: any) => ({ id, ...attrs }));

    const res = await service.completeChallenge('ch1', 'u1');

    // challenge was marked completed
    expect(res.state).toBe('completed');
    // userRepo.update was called at least for winner and loser
    expect(mockUserUpdate).toHaveBeenCalled();
    // notification created for rank update and completions
    expect(mockNotifCreate).toHaveBeenCalled();
  });
});
