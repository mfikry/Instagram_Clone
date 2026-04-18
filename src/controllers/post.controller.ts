import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    // Ambil data yang dikirim dari Postman/Frontend
    const { caption, media } = req.body;

    // Validasi dasar
    if (!media || !Array.isArray(media) || media.length === 0) {
      res.status(400).json({ success: false, message: 'Postingan minimal harus memiliki 1 gambar atau video.' });
      return;
    }

    // Simpan ke database (Post & PostMedia sekaligus)
    const newPost = await prisma.post.create({
      data: {
        userId,
        caption: caption || null,
        media: {
          // Looping array media untuk disimpan ke tabel PostMedia
          create: media.map((item: any, index: number) => ({
            url: item.url,
            type: item.type || 'IMAGE', // "IMAGE" atau "VIDEO"
            order: index                // Buat urutan carousel (slide)
          }))
        }
      },
      include: {
        media: true // Sertakan data media di respons JSON
      }
    });

    res.status(201).json({ success: true, message: 'Post berhasil dibuat!', data: newPost });
  } catch (error: any) {
    console.error('Error createPost:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat membuat post.' });
  }
};