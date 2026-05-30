import { Router } from 'express';
import challengeController from './controllers/challengeController';

const router = Router();

router.get('/challenges/tracks', challengeController.listTrackOptions);
router.get('/challenges', challengeController.list);
router.post('/challenges', challengeController.create);
router.patch('/challenges/:id/accept', challengeController.accept);
router.patch('/challenges/:id/reject', challengeController.reject);
router.patch('/challenges/:id/complete', challengeController.complete);

// Admin challenges management
router.get('/admin/challenges', challengeController.adminList);
router.put('/admin/challenges/:id', challengeController.adminUpdate);
router.delete('/admin/challenges/:id', challengeController.adminDelete);

export default router;
