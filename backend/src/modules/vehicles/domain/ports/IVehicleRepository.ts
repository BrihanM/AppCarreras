import { Vehicle } from '../entities/Vehicle';

export default interface IVehicleRepository {
  create(v: Partial<Vehicle>): Promise<Vehicle>;
  findById(id: string): Promise<Vehicle | null>;
  findByUserId(userId: string): Promise<Vehicle[]>;
  listAll(params?: { userId?: string; search?: string; page?: number; limit?: number }): Promise<Vehicle[]>;
  countByUserId(userId: string): Promise<number>;
  deactivateAllForUser(userId: string): Promise<void>;
  activate(id: string): Promise<Vehicle>;
  update(id: string, attrs: Partial<Vehicle>): Promise<Vehicle>;
  delete(id: string): Promise<void>;
}
