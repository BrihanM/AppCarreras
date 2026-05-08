import { Router } from 'express';
import accountController from './controllers/accountController';
import userController from './controllers/userController';

const router = Router();

// Account routes
router.post('/accounts', accountController.create);
router.get('/accounts/:id', accountController.getById);
router.put('/accounts/:id', accountController.update);
router.delete('/accounts/:id', accountController.remove);

// User routes
router.post('/users', userController.create);
router.get('/users/:id', userController.getById);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.remove);
router.get('/users', userController.list);

export default router;
