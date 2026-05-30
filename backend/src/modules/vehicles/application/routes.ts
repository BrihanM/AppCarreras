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

// Vehicle catalog (for forms)
router.get('/vehicle-catalog/brands', vehicleController.listBrands);
router.get('/vehicle-catalog/models', vehicleController.listModels);

// Admin vehicles CRUD
router.get('/admin/vehicles', vehicleController.adminList);
router.get('/admin/vehicles/:id', vehicleController.adminGetById);
router.put('/admin/vehicles/:id', vehicleController.adminUpdate);
router.delete('/admin/vehicles/:id', vehicleController.adminRemove);

// Admin vehicle catalog CRUD
router.get('/admin/vehicle-catalog', vehicleController.adminListCatalog);
router.post('/admin/vehicle-catalog', vehicleController.adminCreateCatalog);
router.put('/admin/vehicle-catalog/:id', vehicleController.adminUpdateCatalog);

export default router;
