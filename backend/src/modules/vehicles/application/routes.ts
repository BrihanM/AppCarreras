import { Router } from 'express';
import vehicleController from './controllers/vehicleController';

const router = Router();

// Create vehicle for user
router.post('/users/:id/vehicles', vehicleController.createForUser);
// List user vehicles
router.get('/users/:id/vehicles', vehicleController.listForUser);
// Activate vehicle
router.patch('/vehicles/:id/activate', vehicleController.activate);
// Delete vehicle
router.delete('/vehicles/:id', vehicleController.remove);

export default router;
