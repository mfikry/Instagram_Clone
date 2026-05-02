import { Response } from 'express';
import { PrismaClient, FollowStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const toggleFollow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.userId;
    const { targetUserId } = req.params as { targetUserId: string };

    if (!followerId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    if (followerId === targetUserId) {
      res.status(400).json({ success: false, message: 'Anda tidak bisa mem-follow diri sendiri.' });
      return;
    }

    // 1. Cek apakah akun target ada di database
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      return;
    }

    // 2. Cek status relasi saat ini
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: targetUserId
        }
      }
    });

    if (existingFollow) {
      // 3. Kalau udah follow/pending, berarti user minta UNFOLLOW (Hapus Relasi)
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: followerId,
            followingId: targetUserId
          }
        }
      });

      // ✨ HAPUS NOTIFIKASI (Tarik balik notif kalau di-unfollow/batal follow)
      await prisma.notification.deleteMany({
        where: {
          userId: targetUserId,
          actorId: followerId,
          type: 'FOLLOW'
        }
      });

      res.status(200).json({ success: true, message: 'Berhasil unfollow.', isFollowing: false });
    } else {
      // 4. Kalau belum follow, tentukan status berdasarkan privasi akun target
      const followStatus = targetUser.isPrivate ? FollowStatus.PENDING : FollowStatus.ACCEPTED;

      await prisma.follow.create({
        data: {
          followerId: followerId,
          followingId: targetUserId,
          status: followStatus
        }
      });

      // ✨ CCTV NOTIFIKASI DI SINI ✨
      await prisma.notification.create({
        data: {
          userId: targetUserId,   // Penerima (akun yang di-follow)
          actorId: followerId,    // Pelaku (yang nge-follow)
          type: 'FOLLOW',         // Sesuai ENUM
          // entityId nggak perlu diisi buat Follow, karena actorId udah cukup ngasih tau siapa pelakunya
        }
      });

      const message = targetUser.isPrivate 
        ? 'Permintaan follow dikirim (Pending).' 
        : 'Berhasil follow user.';

      res.status(200).json({ success: true, message, isFollowing: true, status: followStatus });
    }

  } catch (error: any) {
    console.error('Error toggleFollow:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memproses follow.' });
  }
};