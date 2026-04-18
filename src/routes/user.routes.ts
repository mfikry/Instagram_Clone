import { Router } from 'express';
import { getMyProfile } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Endpoint: GET /api/users/me
// Alur: Request -> Lewati requireAuth (satpam) -> Masuk ke getMyProfile
router.get('/me', requireAuth, getMyProfile);

export default router;