import { Router } from 'express';
// import createPost yang lama, sesuaikan nama fungsinya kalau beda
import { createPost, deletePost, getPostById } from '../controllers/post.controller'; 
import { requireAuth , optionalAuth} from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Konfigurasi Multer (Cara nyimpen filenya)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Simpan ke folder uploads
  },
  filename: (req, file, cb) => {
    // Kasih nama unik biar foto ga ketimpa (contoh: 168439291-12345.jpg)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Endpoint: POST /api/posts
// Kita selipin upload.single('media') sebelum createPost
router.post('/', requireAuth, upload.single('media'), createPost);
// Tambahkan di bawah router.post('/', ...)
router.get('/:id', optionalAuth, getPostById);
router.delete('/:id', requireAuth, deletePost);
export default router;