import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    // FIX 1: Tegaskan ke TypeScript bahwa postId pasti sebuah string
    const { postId } = req.params as { postId: string }; 

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
    const existingLike = await prisma.postLike.findFirst({
      where: {
        userId: userId,
        postId: postId,
      },
    });

    if (existingLike) {
      // 3. Kalau udah ada like-nya, berarti user minta UNLIKE
      await prisma.postLike.deleteMany({
        where: { 
          userId: userId,
          postId: postId
        },
      });

      // ✨ HAPUS NOTIFIKASI (Biar nggak ada notif hantu kalau di-unlike)
      if (post.userId !== userId) {
        await prisma.notification.deleteMany({
          where: {
            userId: post.userId,
            actorId: userId,
            type: 'LIKE_POST',
            entityId: postId
          }
        });
      }

      res.status(200).json({ success: true, message: 'Berhasil unlike postingan.', isLiked: false });
    } else {
      // 4. Kalau belum ada, berarti user minta LIKE (Buat data Like baru)
      await prisma.postLike.create({
        data: {
          userId: userId,
          postId: postId,
        },
      });

      // ✨ CCTV NOTIFIKASI DI SINI ✨
      // Syarat: Jangan kirim notif kalau user nge-like postingannya sendiri
      if (post.userId !== userId) {
        await prisma.notification.create({
          data: {
            userId: post.userId, // Penerima (yang punya post)
            actorId: userId,     // Pelaku (yang nge-like)
            type: 'LIKE_POST',   // Sesuai ENUM di schema
            entityId: postId     // ID postingan yang dilike
          }
        });
      }

      res.status(200).json({ success: true, message: 'Berhasil like postingan.', isLiked: true });
    }

  } catch (error: any) {
    console.error('Error toggleLike:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat memproses like.' });
  }
};