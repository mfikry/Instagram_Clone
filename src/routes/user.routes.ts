import { Router } from 'express';
import { getMyProfile, getUserProfile, searchUsers, updateProfile } from '../controllers/user.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { upload } from './post.routes';

const router = Router();

// Endpoint: GET /api/users/me
// Alur: Request -> Lewati requireAuth (satpam) -> Masuk ke getMyProfile
router.get('/me', requireAuth, getMyProfile);
router.get('/search', requireAuth, searchUsers);
router.patch('/me', requireAuth, upload.single('avatar'), updateProfile);

// Endpoint: GET /api/users/:username (PROFIL ORANG LAIN / PUBLIK)
// DITARUH DI BAWAH /me BIAR TIDAK BENTROK
router.get('/:username', optionalAuth, getUserProfile);
export default router;