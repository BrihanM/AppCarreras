import { Router } from 'express';
import cacheController from './controllers/cacheController';

const router = Router();

router.get('/admin/cache-rules', cacheController.list);
router.post('/admin/cache-rules', cacheController.createRule);
router.put('/admin/cache-rules/:id', cacheController.updateRule);
router.delete('/admin/cache-rules/:id', cacheController.remove);

export default router;
