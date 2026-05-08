import { Router } from 'express';
import notificationController from './controllers/notificationController';

const router = Router();

router.get('/notifications', notificationController.list);
router.post('/notifications', notificationController.create);
router.patch('/notifications/:id/read', notificationController.markRead);

export default router;
