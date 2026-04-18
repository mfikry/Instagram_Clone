import { Router } from 'express';
import { addComment, getCommentsByPost } from '../controllers/comment.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Endpoint: GET /api/comments/:postId (Ambil komentar)
router.get('/:postId', requireAuth, getCommentsByPost);

// Endpoint: POST /api/comments/:postId (Tambah komentar)
router.post('/:postId', requireAuth, addComment);

export default router;