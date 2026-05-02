import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: any, res: any): Promise<void> => {
  try {
    const userId = req.userId; // Dari middleware auth

    const notifications = await prisma.notification.findMany({
      where: { userId: userId }, // Ambil notif di mana user ini adalah penerimanya
      orderBy: { createdAt: 'desc' },
      include: {
        // Ambil data si pelaku (actor) biar bisa nampilin foto & username dia
        actor: { 
          select: { id: true, username: true, avatarUrl: true } 
        }
      }
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error getNotifications:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat notifikasi' });
  }
};