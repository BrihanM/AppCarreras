import IVehicleRepository from '../ports/IVehicleRepository';
import { Vehicle } from '../entities/Vehicle';
import { v4 as uuidv4 } from 'uuid';

class VehicleService {
  private repo: IVehicleRepository;

  constructor(repo: IVehicleRepository) {
    this.repo = repo;
  }

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

  async listByUser(userId: string): Promise<Vehicle[]> {
    return this.repo.findByUserId(userId);
  }

  async activateVehicle(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) throw new Error('Vehicle not found');
    await this.repo.deactivateAllForUser(vehicle.user_id);
    return this.repo.activate(id);
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}

export default VehicleService;
