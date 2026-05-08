jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
/**
 * VehicleService.spec.ts
 * Unit tests para `VehicleService` cubriendo reglas de negocio:
 * - Límite de 3 vehículos
 * - Activación de vehículo (desactiva los demás)
 */
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import VehicleService from '../domain/services/VehicleService';

describe('VehicleService (unit)', () => {
  const mockRepo: any = {
    countByUserId: jest.fn(),
    create: jest.fn(),
    findByUserId: jest.fn(),
    findById: jest.fn(),
    deactivateAllForUser: jest.fn(),
    activate: jest.fn(),
    delete: jest.fn(),
  };
  const service = new VehicleService(mockRepo);

  beforeEach(() => jest.clearAllMocks());

  /**
   * createVehicle: lanza error cuando el usuario ya tiene 3 vehículos
   * - Arrange: `countByUserId` devuelve 3
   * - Act: intentar crear un vehículo
   * - Assert: se lanza error indicando el límite de 3
   */
  test('createVehicle throws when user has 3 vehicles', async () => {
    mockRepo.countByUserId.mockResolvedValue(3);
    await expect(service.createVehicle('u1', { model: 'X' } as any)).rejects.toThrow('User already has maximum number of vehicles (3)');
  });

  /**
   * createVehicle: crea vehículo cuando está dentro del límite
   * - Arrange: `countByUserId` < 3 y `create` del repo resuelve
   * - Act: llamar a `createVehicle`
   * - Assert: retorna el vehículo creado y el repo fue llamado
   */
  test('createVehicle creates when under limit', async () => {
    mockRepo.countByUserId.mockResolvedValue(1);
    mockRepo.create.mockResolvedValue({ id: 'v1', user_id: 'u1' });
    const res = await service.createVehicle('u1', { model: 'X' } as any);
    expect(res).toEqual({ id: 'v1', user_id: 'u1' });
  });

  /**
   * activateVehicle: lanza si el vehículo no existe
   * - Arrange: `findById` devuelve null
   * - Act/Assert: llamar `activateVehicle` y esperar excepción 'Vehicle not found'
   */
  test('activateVehicle throws when not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.activateVehicle('nope')).rejects.toThrow('Vehicle not found');
  });

  /**
   * activateVehicle: activa el vehículo y desactiva los demás del usuario
   * - Arrange: `findById` devuelve vehículo, `activate` resuelve
   * - Act: llamar `activateVehicle`
   * - Assert: `deactivateAllForUser` y `activate` fueron invocados; resultado activo
   */
  test('activateVehicle activates and deactivates others', async () => {
    const vehicle = { id: 'v1', user_id: 'u1' };
    mockRepo.findById.mockResolvedValue(vehicle);
    mockRepo.activate.mockResolvedValue({ id: 'v1', user_id: 'u1', active: true });
    const res = await service.activateVehicle('v1');
    expect(mockRepo.deactivateAllForUser).toHaveBeenCalledWith('u1');
    expect(mockRepo.activate).toHaveBeenCalledWith('v1');
    expect(res).toHaveProperty('active', true);
  });
});
