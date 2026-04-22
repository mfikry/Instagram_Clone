import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
// Inisialisasi Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
export const createPost = async (req: any, res: any): Promise<void> => {
  try {
    const userId = req.userId;
    const { caption } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Akses ditolak.' });
      return;
    }

    // Cek apakah ada file (karena kita pakai memoryStorage, file ada di req.file.buffer)
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Gambar wajib diupload!' });
      return;
    }

    // --- PROSES OPTIMASI GAMBAR (SHARP) ---
    // Kita perkecil resolusi dan kompres kualitasnya di sini
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true }) // Maksimal 1080px
      .jpeg({ quality: 80 }) // Kompres ke JPEG kualitas 80%
      .toBuffer();

    // Buat nama file unik
    const fileName = `${userId}-${Date.now()}.jpg`;

    // --- PROSES UPLOAD KE SUPABASE STORAGE ---
    const { data, error: uploadError } = await supabase.storage
      .from('media') // Nama bucket yang lu buat di Supabase
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      res.status(500).json({ success: false, message: 'Gagal upload ke cloud storage.' });
      return;
    }

    // Ambil Public URL-nya
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    // --- SIMPAN KE DATABASE PRISMA ---
    const newPost = await prisma.post.create({
      data: {
        userId: userId,
        caption: caption || '',
        media: {
          create: [
            {
              url: publicUrl,
              type: 'IMAGE',
            }
          ]
        }
      },
      include: {
        media: true
      }
    });

    res.status(201).json({
      success: true, 
      message: 'Postingan berhasil dibuat & dioptimasi!', 
      data: newPost 
    });

  } catch (error: any) {
    console.error('Error createPost:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat membuat postingan.' });
  }
};
export const getPostById = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId; // Ambil ID user yang lagi login
    
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        media: { orderBy: { order: 'asc' } },
        _count: { select: { likes: true, comments: true } },
        
        // ✨ TAMBAHKAN BARIS INI: Cek apakah current user udah nge-like
        likes: currentUserId ? { where: { userId: currentUserId } } : false
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
