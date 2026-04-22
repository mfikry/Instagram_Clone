import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken'; 

export interface AuthRequest extends Request {
  userId?: string;
}

// Inisialisasi Supabase
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Akses ditolak. Format token salah.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Akses ditolak. Token kosong.' });
    return;
  }

  try {
    // Minta Supabase yang ngecek tokennya (Bebas dari masalah ES256 vs HS256)
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
      return;
    }

    req.userId = data.user.id;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat verifikasi.' });
  }
};

// Bikin middleware baru yang nggak galak (JADIKAN ASYNC karena nembak API Supabase)
export const optionalAuth = async (req: any, res: any, next: any) => {
  // Cek dua tempat: dari Header (Axios) atau dari Cookies langsung
  const authHeader = req.headers.authorization;
  const tokenFromCookie = req.cookies ? req.cookies.token : null; 
  
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (tokenFromCookie) {
    token = tokenFromCookie;
  }
  
  if (token) {
    try {
      // FIX UTAMA: Pakai cara Supabase persis kayak di requireAuth!
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        console.error("❌ [optionalAuth] Token ditolak Supabase:", error?.message);
        req.userId = null;
      } else {
        // Berhasil!
        req.userId = data.user.id; 
        
      }
      
    } catch (error: any) {
      req.userId = null;
    }
  } else {
    req.userId = null; 
  }
  
  next(); // Lanjutin perjalanan!
};