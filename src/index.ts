import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes'; 
import feedRoutes from './routes/feed.routes';
import likeRoutes from './routes/like.routes';
import commentRoutes from './routes/comment.routes';
import followRoutes from './routes/follow.routes';
import path from 'path';


dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:3000', 
    process.env.FRONTEND_URL || '' // Nanti kita isi kalau Frontend udah live
  ],
  credentials: true, 
}));
app.use(express.json()); 

// Endpoint untuk test koneksi
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Instagram Clone API is running!' });
});

// Daftarkan route-nya ke Express
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follows', followRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// UBAH bagian paling bawah ini:
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// WAJIB DITAMBAHKAN BIAR VERCEL BISA BACA:
export default app;