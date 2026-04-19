import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { caption } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    // req.file ini otomatis diisi sama Multer kalau ada gambar yang dikirim
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Gambar wajib diupload!' });
      return;
    }

    // Bikin URL lengkap biar bisa dibaca Frontend (Next.js)
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    // Simpan ke Database
    const newPost = await prisma.post.create({
      data: {
        userId: userId,
        caption: caption,
        // Kerennya Prisma: Langsung simpan relasi ke tabel PostMedia
        media: {
          create: [
            {
              url: imageUrl,
              type: 'IMAGE',
            }
          ]
        }
      },
      include: {
        media: true
      }
    });

    res.status(201).json({ success: true, message: 'Postingan berhasil dibuat!', data: newPost });
  } catch (error: any) {
    console.error('Error createPost:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat membuat postingan.' });
  }
};
export const getPostById = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        media: { orderBy: { order: 'asc' } },
        _count: { select: { likes: true, comments: true } }
      }
    });

    if (!post) {
      res.status(404).json({ success: false, message: 'Postingan tidak ditemukan' });
      return;
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error('Error getPostById:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil postingan' });
  }
};
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // FIX 1: Yakinkan TypeScript kalau userId ada
    if (!userId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    // FIX 2: Tegaskan ke TypeScript kalau id adalah sebuah string tunggal
    const { id } = req.params as { id: string };

    const post = await prisma.post.findUnique({ where: { id } });
    
    if (!post || post.userId !== userId) {
      res.status(403).json({ success: false, message: 'Akses ditolak atau postingan tidak ada.' });
      return;
    }

    // Hapus relasi (Prisma Transaction)
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { postId: id } }),
      
      // FIX 3: Sesuaikan dengan nama model di schema.prisma lu (like atau likes)
      prisma.postLike.deleteMany({ where: { postId: id } }),
      
      prisma.postMedia.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    res.status(200).json({ success: true, message: 'Postingan berhasil dihapus.' });
  } catch (error) {
    console.error('Error deletePost:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus postingan.' });
  }
};