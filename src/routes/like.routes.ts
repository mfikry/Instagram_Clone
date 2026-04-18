import { Router } from 'express';
import { toggleLike } from '../controllers/like.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Endpoint: POST /api/likes/:postId
router.post('/:postId', requireAuth, toggleLike);

export default router;