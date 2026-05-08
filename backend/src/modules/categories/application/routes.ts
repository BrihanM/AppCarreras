import { Router } from 'express';
import categoryController from './controllers/categoryController';

const router = Router();

router.get('/categories', categoryController.list);
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.remove);

export default router;
