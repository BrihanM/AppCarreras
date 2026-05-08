import { Router } from 'express';
import accountController from './controllers/accountController';
import authController from './controllers/authController';

const router = Router();

// Account routes
router.post('/accounts', accountController.create);
router.get('/accounts/:id', accountController.getById);
router.put('/accounts/:id', accountController.update);
router.delete('/accounts/:id', accountController.remove);

// Auth routes
router.post('/auth/login', authController.login);

export default router;
