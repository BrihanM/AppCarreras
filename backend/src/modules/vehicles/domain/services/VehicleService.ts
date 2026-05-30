import IVehicleRepository from '../ports/IVehicleRepository';
import { Vehicle } from '../entities/Vehicle';
import { v4 as uuidv4 } from 'uuid';
import { getIo } from '../../../../socket';

/**
 * Servicio de dominio para `Vehicle`.
 * - Encapsula la lógica para crear, listar, activar y borrar vehículos.
 * - Aplica reglas de negocio: máximo 3 vehículos por usuario y sólo 1 activo.
 * - Emite eventos WebSocket a la sala `user:<id>` cuando corresponde.
 */
class VehicleService {
  private repo: IVehicleRepository;

  constructor(repo: IVehicleRepository) {
    this.repo = repo;
  }

  /**
   * createVehicle
   * Crea un vehículo para un usuario.
   * - Valida que el usuario no tenga más de 3 vehículos.
   * - Si el nuevo vehículo viene como `active`, desactiva los demás del usuario.
   *
   * @param {string} userId - Identificador del propietario.
   * @param {Partial<Vehicle>} attrs - Atributos del vehículo.
   * @returns {Promise<Vehicle>} Vehículo creado.
   */
  async createVehicle(userId: string, attrs: Partial<Vehicle>): Promise<Vehicle> {
    const count = await this.repo.countByUserId(userId);
    if (count >= 3) throw new Error('User already has maximum number of vehicles (3)');
    const id = attrs.id || uuidv4();
    const vehicleToCreate: Partial<Vehicle> = {
      ...attrs,
      id,
      user_id: userId,
      active: attrs.active || false,
    };

    // If is active, ensure only one active per user
    if (vehicleToCreate.active) {
      await this.repo.deactivateAllForUser(userId);
    }

    return this.repo.create(vehicleToCreate as Vehicle);
  }

  /**
   * listByUser
   * Lista los vehículos de un usuario.
   * @param {string} userId - Identificador del usuario.
   * @returns {Promise<Vehicle[]>} Array de vehículos.
   */
  async listByUser(userId: string): Promise<Vehicle[]> {
    return this.repo.findByUserId(userId);
  }

  /**
   * listAllVehicles
   * Listado administrativo con filtros opcionales.
   */
  async listAllVehicles(params?: { userId?: string; search?: string; page?: number; limit?: number }): Promise<Vehicle[]> {
    return this.repo.listAll(params);
  }

  /**
   * activateVehicle
   * Activa un vehículo concreto (y desactiva los demás del mismo usuario).
   * - Lanza error si el vehículo no existe.
   * - Emite evento `vehicle:activated` al propietario.
   *
   * @param {string} id - Identificador del vehículo a activar.
   * @returns {Promise<Vehicle>} Vehículo activado.
   */
  async activateVehicle(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) throw new Error('Vehicle not found');
    await this.repo.deactivateAllForUser(vehicle.user_id);
    const activated = await this.repo.activate(id);
    try {
      const io = getIo();
      if (io) io.to(`user:${activated.user_id}`).emit('vehicle:activated', activated);
    } catch (e) {}
    return activated;
  }

  /**
   * updateVehicle
   * Actualiza un vehículo y mantiene la regla de un único activo por usuario.
   */
  async updateVehicle(id: string, attrs: Partial<Vehicle>): Promise<Vehicle> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error('Vehicle not found');

    const nextUserId = attrs.user_id || existing.user_id;
    const nextActive = typeof attrs.active === 'boolean' ? attrs.active : !!existing.active;

    if (nextActive) {
      await this.repo.deactivateAllForUser(nextUserId);
    }

    const updated = await this.repo.update(id, { ...attrs, user_id: nextUserId, active: nextActive });
    try {
      const io = getIo();
      if (io) {
        io.to(`user:${updated.user_id}`).emit('vehicle:updated', updated);
      }
    } catch (e) {}
    return updated;
  }

  /**
   * deleteVehicle
   * Elimina un vehículo y emite evento `vehicle:deleted` al propietario.
   *
   * @param {string} id - Identificador del vehículo a eliminar.
   * @returns {Promise<void>}
   */
  async deleteVehicle(id: string): Promise<void> {
    const vehicle = await this.repo.findById(id);
    await this.repo.delete(id);
    try {
      const io = getIo();
      if (io && vehicle) io.to(`user:${vehicle.user_id}`).emit('vehicle:deleted', vehicle);
    } catch (e) {}
    return;
  }
}

export default VehicleService;
