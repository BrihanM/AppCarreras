import { Router } from 'express';
import userController from './controllers/userController';

const router = Router();

// Endpoint para obtener y actualizar el perfil propio (must be authenticated)
router.get('/users/me', userController.getMe);
router.put('/users/me', userController.updateMe);

router.post('/users', userController.create);
router.get('/users/:id', userController.getById);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.remove);
router.get('/users', userController.list);

export default router;
