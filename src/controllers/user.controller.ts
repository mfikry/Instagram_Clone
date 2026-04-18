import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    // req.userId ini dapet dari hasil verifikasi middleware auth kita
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Cari user di database Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        // Kerennya Prisma: Kita bisa sekalian ngitung jumlah followers/following & post!
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Data user tidak ditemukan di database.' });
    }

    // Kirim data ke frontend
    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('Error getMyProfile:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};