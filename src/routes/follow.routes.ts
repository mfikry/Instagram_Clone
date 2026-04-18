import { Router } from 'express';
import { toggleFollow } from '../controllers/follow.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Endpoint: POST /api/follows/:targetUserId
router.post('/:targetUserId', requireAuth, toggleFollow);

export default router;