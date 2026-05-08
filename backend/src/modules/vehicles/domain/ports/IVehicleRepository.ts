import { Vehicle } from '../entities/Vehicle';

export default interface IVehicleRepository {
  create(v: Partial<Vehicle>): Promise<Vehicle>;
  findById(id: string): Promise<Vehicle | null>;
  findByUserId(userId: string): Promise<Vehicle[]>;
  countByUserId(userId: string): Promise<number>;
  deactivateAllForUser(userId: string): Promise<void>;
  activate(id: string): Promise<Vehicle>;
  delete(id: string): Promise<void>;
}
