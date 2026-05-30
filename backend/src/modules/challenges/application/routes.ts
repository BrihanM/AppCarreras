import { Router } from 'express';
import challengeController from './controllers/challengeController';

const router = Router();

router.get('/challenges', challengeController.list);
router.post('/challenges', challengeController.create);
router.patch('/challenges/:id/accept', challengeController.accept);
router.patch('/challenges/:id/reject', challengeController.reject);
router.patch('/challenges/:id/complete', challengeController.complete);

export default router;
