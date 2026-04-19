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
export const getUserProfile = async (req: any, res: any): Promise<void> => {
  try {
    const targetUsername = req.params.username;
    const currentUserId = req.userId; // SEKARANG BISA NULL KALAU DIA GUEST

    const user = await prisma.user.findUnique({
      where: { username: targetUsername },
      include: {
        _count: { select: { posts: true, followers: true, following: true } }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    // Default status buat tamu/guest
    let isFollowing = false;
    let followStatus = null;
    let isOwnProfile = false;

    // LOGIKA CERDAS: Cuma jalanin cek kalau yang buka punya akun (Login)
    if (currentUserId) {
      // FIX UTAMA 2: Bungkus pakai String() biar pasti cocok 100%
      isOwnProfile = String(currentUserId) === String(user.id);
      
      const follow = await prisma.follow.findFirst({
        where: { followerId: currentUserId, followingId: user.id }
      });
      if (follow) {
        isFollowing = follow.status === 'ACCEPTED';
        followStatus = follow.status;
      }
    }

    const isPrivate = user.isPrivate && !isOwnProfile && !isFollowing;

    // Tarik postingan kalau bukan private
    let posts: any[] = [];
    if (!isPrivate) {
      posts = await prisma.post.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          _count: { select: { likes: true, comments: true } }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profile: user,
        relationship: { isOwnProfile, isFollowing, followStatus },
        isPrivate,
        posts
      }
    });
  } catch (error) {
    console.error('Error getUserProfile:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat profil' });
  }
};
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    
    // Kalau kolom pencarian kosong, balikin array kosong aja
    if (!query) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    // Cari user yang username-nya mengandung huruf yang diketik
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive', // Huruf besar/kecil ga masalah (Aman)
        },
      },
      take: 10, // Batasi 10 hasil maksimal biar enteng
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    console.error('Error searchUsers:', error);
    res.status(500).json({ success: false, message: 'Gagal mencari user' });
  }
};
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // FIX 1: Yakinkan TypeScript kalau userId itu PASTI ada
    if (!userId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    const { fullName, bio } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        fullName: fullName || undefined, 
        bio: bio || undefined 
      }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Profil berhasil diperbarui', 
      data: updatedUser 
    });
  } catch (error) {
    console.error('Error updateProfile:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil' });
  }
};