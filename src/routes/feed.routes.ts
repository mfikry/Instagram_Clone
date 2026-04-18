import { Router } from 'express';
import { getFeed } from '../controllers/feed.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Endpoint: GET /api/feed
router.get('/', requireAuth, getFeed);

export default router;