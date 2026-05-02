import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getNotifications } from '../controllers/notification.controller';

const router = Router();

// Rute buat narik notifikasi (Harus login, makanya dipakein requireAuth)
router.get('/', requireAuth, getNotifications);

export default router;