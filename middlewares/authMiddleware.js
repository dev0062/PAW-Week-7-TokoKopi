/**
 * ============================================================================
 * FILE: middlewares/authMiddleware.js
 * ============================================================================
 */

const crypto = require('crypto');
const userModel = require('../models/userModel');

const COOKIE_INTERNAL = 'devtech_internal_auth';
const COOKIE_PELANGGAN = 'devtech_table_session';
const SECRET_KEY = process.env.SESSION_SECRET || 'devtech-paw-2026-secret-key';

function buatTokenAman(payloadObj) {
  const jsonStr = JSON.stringify(payloadObj);
  const base64Data = Buffer.from(jsonStr, 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Data)
    .digest('base64url');
  return `${base64Data}.${signature}`;
}

function verifikasiTokenAman(tokenStr) {
  if (!tokenStr || !tokenStr.includes('.')) return null;
  const [base64Data, signature] = tokenStr.split('.');
  const expectedSig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Data)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const hasil = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = decodeURIComponent(pair.slice(idx + 1).trim());
      hasil[key] = val;
    }
  });
  return hasil;
}

function attachSession(req, res, next) {
  const cookies = parseCookies(req);

  // 1. Cek sesi login internal (Pemilik / Staf)
  req.user = null;
  const tokenInternal = cookies[COOKIE_INTERNAL];
  if (tokenInternal) {
    const dataToken = verifikasiTokenAman(tokenInternal);
    if (dataToken && dataToken.username) {
      const profil = userModel.getUserByUsername(dataToken.username);
      if (profil) {
        req.user = profil;
      }
    }
  }

  // 2. Cek sesi login pelanggan (Nama & Nomor Meja)
  req.pelanggan = null;
  const tokenPelanggan = cookies[COOKIE_PELANGGAN];
  if (tokenPelanggan) {
    const dataMeja = verifikasiTokenAman(tokenPelanggan);
    if (dataMeja && dataMeja.nomorMeja) {
      req.pelanggan = {
        namaPelanggan: dataMeja.namaPelanggan || `Pelanggan Meja ${dataMeja.nomorMeja}`,
        nomorMeja: String(dataMeja.nomorMeja).padStart(2, '0'),
        waktuMasuk: dataMeja.waktuMasuk
      };
    }
  }

  res.locals.currentUser = req.user;
  res.locals.currentPelanggan = req.pelanggan;
  next();
}

/**
 * Middleware: Wajib Login Pelanggan untuk membuka katalog menu & pesan dari meja
 */
function requirePelanggan(req, res, next) {
  // Jika sudah ada sesi pelanggan
  if (req.pelanggan) {
    return next();
  }

  // Jika URL membawa ?meja=XX (misal scan QR code fisik di meja)
  if (req.query.meja) {
    return res.redirect(`/login?role=pelanggan&meja=${req.query.meja}`);
  }

  // Jika belum login pelanggan sama sekali, arahkan ke login
  return res.redirect('/login');
}

/**
 * Middleware proteksi rute internal ('pemilik' atau 'staf').
 */
function requireRole(allowedRoles = ['pemilik', 'staf']) {
  return function (req, res, next) {
    const isEndpointApi = req.originalUrl.startsWith('/api/');

    if (!req.user) {
      if (isEndpointApi) {
        return res.status(401).json({
          sukses: false,
          pesanError: 'Sesi berakhir. Silakan login terlebih dahulu.'
        });
      }
      const roleParam = allowedRoles.includes('staf') ? 'staf' : 'pemilik';
      return res.redirect(`/login?role=${roleParam}`);
    }

    if (!allowedRoles.includes(req.user.role)) {
      if (isEndpointApi) {
        return res.status(403).json({
          sukses: false,
          pesanError: `Akses ditolak. Fitur ini hanya untuk peran: ${allowedRoles.join(' / ')}.`
        });
      }
      return res.redirect(`${req.user.halamanUtama}?akses=ditolak`);
    }

    next();
  };
}

module.exports = {
  COOKIE_INTERNAL,
  COOKIE_PELANGGAN,
  buatTokenAman,
  attachSession,
  requirePelanggan,
  requireRole
};
