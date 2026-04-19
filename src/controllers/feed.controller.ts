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

    const limit = parseInt(req.query.limit as string) || 5; 
    const cursor = req.query.cursor as string;

    // --- 🧠 ALGORITMA TIMELINE DIMULAI DI SINI ---

    // 1. Cari tau siapa aja yang kita follow (yang statusnya ACCEPTED)
    const followings = await prisma.follow.findMany({
      where: { 
        followerId: userId,
        status: 'ACCEPTED' 
      },
      select: { followingId: true }
    });

    // 2. Ekstrak dan kumpulin ID mereka ke dalam satu array
    // Hasilnya misal: ['id-user-a', 'id-user-b']
    const followingIds = followings.map(f => f.followingId);

    // 3. Tambahin ID kita sendiri biar postingan kita juga muncul di Feed
    const targetUserIds = [...followingIds, userId];

    // --- ALGORITMA SELESAI ---

    // 4. Tarik postingan dari database (HANYA DARI TARGET USER IDS)
    const posts = await prisma.post.findMany({
      where: {
        userId: { in: targetUserIds } // <-- INI KUNCI RAHASIANYA! (SQL IN Operator)
      },
      take: limit, 
      ...(cursor && {
        skip: 1, 
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: 'desc' }, 
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        media: { orderBy: { order: 'asc' } },
        _count: { select: { likes: true, comments: true } }
      }
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1]?.id : null;

    res.status(200).json({ 
      success: true, 
      data: posts,
      pagination: { nextCursor }
    });

  } catch (error: any) {
    console.error('Error getFeed:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil feed.' });
  }
};