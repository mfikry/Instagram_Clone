import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    // Ambil parameter limit (berapa banyak per request) dan cursor (ID postingan terakhir)
    const limit = parseInt(req.query.limit as string) || 5; 
    const cursor = req.query.cursor as string;

    // Ambil postingan dari database
    const posts = await prisma.post.findMany({
      take: limit, // Batasi jumlah yang diambil
      ...(cursor && {
        skip: 1, // Lewati kursornya (biar nggak keambil 2x)
        cursor: {
          id: cursor,
        },
      }),
      orderBy: {
        createdAt: 'desc', // Urutkan dari yang paling baru
      },
      // Kerennya Prisma: Ambil data relasinya sekalian (Join table otomatis)
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true } // Cukup ambil info publik user
        },
        media: {
          orderBy: { order: 'asc' } // Urutkan gambar sesuai slide
        },
        _count: {
          select: { likes: true, comments: true } // Hitung jumlah like & comment
        }
      }
    });

    // Tentukan kursor untuk halaman selanjutnya
    const nextCursor = posts.length === limit ? posts[posts.length - 1]?.id : null;
    res.status(200).json({ 
      success: true, 
      data: posts,
      pagination: {
        nextCursor
      }
    });

  } catch (error: any) {
    console.error('Error getFeed:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil feed.' });
  }
};