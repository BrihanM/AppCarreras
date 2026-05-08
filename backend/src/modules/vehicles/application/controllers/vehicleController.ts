import { Request, Response } from 'express';
import VehicleRepositoryPg from '../../infrastructure/adapters/pg/VehicleRepositoryPg';
import VehicleService from '../../domain/services/VehicleService';
import { createVehicleSchema } from '../validators/vehicleSchemas';

const repo = new VehicleRepositoryPg();
const service = new VehicleService(repo);

const createForUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const parsed = createVehicleSchema.parse(req.body);
    const created = await service.createVehicle(userId, parsed as any);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const listForUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const items = await service.listByUser(userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const activate = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await service.activateVehicle(id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const remove = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await service.deleteVehicle(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { createForUser, listForUser, activate, remove };
