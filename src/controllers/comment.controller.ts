import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Fungsi 1: Tambah Komentar
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { postId } = req.params as { postId: string };
    
    // FIX: Sesuaikan dengan nama kolom di schema.prisma yaitu 'content'
    const { content } = req.body; 

    if (!userId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    if (!content || content.trim() === '') {
      res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong.' });
      return;
    }

    // Cek apakah postingannya valid
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, message: 'Postingan tidak ditemukan.' });
      return;
    }

    // Simpan komentar ke database
    const newComment = await prisma.comment.create({
      data: {
        content: content, 
        userId: userId,
        postId: postId,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    // ✨ CCTV NOTIFIKASI DI SINI ✨
    // Syarat: Jangan kirim notif kalau user komentar di postingannya sendiri
    if (post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,   // Penerima (yang punya postingan)
          actorId: userId,       // Pelaku (yang nulis komentar)
          type: 'COMMENT',       // Sesuai ENUM
          entityId: postId       // Simpan ID postingan biar nanti notifnya bisa diklik menuju postingan
        }
      });
    }

    res.status(201).json({ success: true, message: 'Berhasil menambahkan komentar.', data: newComment });
  } catch (error: any) {
    console.error('Error addComment:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menambah komentar.' });
  }
};

// Fungsi 2: Ambil Daftar Komentar (Nggak ada perubahan, biarin aja)
export const getCommentsByPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params as { postId: string };

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, message: 'Postingan tidak ditemukan.' });
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      orderBy: { createdAt: 'desc' }, 
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    res.status(200).json({ success: true, data: comments });
  } catch (error: any) {
    console.error('Error getComments:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil komentar.' });
  }
};