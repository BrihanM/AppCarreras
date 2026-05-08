import { Router } from 'express';
import challengeController from './controllers/challengeController';

const router = Router();

router.post('/challenges', challengeController.create);
router.put('/challenges/:id/accept', challengeController.accept);
router.put('/challenges/:id/reject', challengeController.reject);
router.put('/challenges/:id/complete', challengeController.complete);

export default router;
