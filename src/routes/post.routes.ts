import { Router } from 'express';
// import createPost yang lama, sesuaikan nama fungsinya kalau beda
import { createPost, deletePost, getPostById } from '../controllers/post.controller'; 
import { requireAuth , optionalAuth} from '../middleware/auth.middleware';
import multer from 'multer';


const router = Router();

const storage = multer.memoryStorage();

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // Batas maksimal 5MB misalnya
});

// Endpoint: POST /api/posts
// Kita selipin upload.single('media') sebelum createPost
router.post('/', requireAuth, upload.single('media'), createPost);
// Tambahkan di bawah router.post('/', ...)
router.get('/:id', optionalAuth, getPostById);
router.delete('/:id', requireAuth, deletePost);
export default router;