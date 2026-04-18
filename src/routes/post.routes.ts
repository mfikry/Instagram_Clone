import { Router } from 'express';
import { createPost } from '../controllers/post.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Endpoint: POST /api/posts
router.post('/', requireAuth, createPost);

export default router;