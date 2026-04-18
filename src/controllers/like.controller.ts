import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { postId } = req.params; // Ambil ID postingan dari URL param

    if (!userId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    // 1. Cek dulu apakah postingannya ada di database
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, message: 'Postingan tidak ditemukan.' });
      return;
    }

    // 2. Cek apakah user sudah pernah nge-like postingan ini
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: userId,
        postId: postId,
      },
    });

    if (existingLike) {
      // 3. Kalau udah ada like-nya, berarti user minta UNLIKE (Hapus data Like)
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      res.status(200).json({ success: true, message: 'Berhasil unlike postingan.', isLiked: false });
    } else {
      // 4. Kalau belum ada, berarti user minta LIKE (Buat data Like baru)
      await prisma.like.create({
        data: {
          userId: userId,
          postId: postId,
        },
      });
      res.status(200).json({ success: true, message: 'Berhasil like postingan.', isLiked: true });
    }

  } catch (error: any) {
    console.error('Error toggleLike:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat memproses like.' });
  }
};