/**
 * ============================================================================
 * FILE: controllers/authController.js
 * ============================================================================
 */

const appConfig = require('../config/appConfig');
const userModel = require('../models/userModel');
const {
  COOKIE_INTERNAL,
  COOKIE_PELANGGAN,
  buatTokenAman
} = require('../middlewares/authMiddleware');

/**
 * GET /login
 * Halaman Login Bersih, Modern, Human-Centered (Bukan UI Card Hitam Kaku AI).
 */
function renderHalamanLogin(req, res) {
  // Jika sudah login internal
  if (req.user && !req.query.ganti) {
    return res.redirect(req.user.halamanUtama);
  }

  // Jika sudah login pelanggan & tidak minta ganti
  if (req.pelanggan && !req.query.ganti && !req.query.role) {
    return res.redirect('/');
  }

  const roleAwal = req.query.role || 'pelanggan';
  const pesanError = req.query.error || '';
  const mejaParam = req.query.meja || (req.pelanggan ? req.pelanggan.nomorMeja : '04');

  return res.render('login', {
    halamanAktif: 'login',
    appConfig,
    roleAwal,
    pesanError,
    mejaParam
  });
}

/**
 * POST /auth/login-pelanggan
 * Pelanggan login menggunakan Nama & Nomor Meja
 */
function prosesLoginPelanggan(req, res) {
  const { namaPelanggan, nomorMeja } = req.body;
  const nama = String(namaPelanggan || '').trim();
  const meja = String(
    Math.min(appConfig.jumlahMeja, Math.max(1, Number(nomorMeja) || 4))
  ).padStart(2, '0');

  if (!nama) {
    return res.status(400).render('login', {
      halamanAktif: 'login',
      appConfig,
      roleAwal: 'pelanggan',
      pesanError: 'Silakan masukkan nama Anda untuk memulai pesanan.',
      mejaParam: meja
    });
  }

  const tokenMeja = buatTokenAman({
    namaPelanggan: nama,
    nomorMeja: meja,
    waktuMasuk: new Date().toISOString()
  });

  res.setHeader(
    'Set-Cookie',
    `${COOKIE_PELANGGAN}=${encodeURIComponent(tokenMeja)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=14400`
  );

  return res.redirect(`/?meja=${meja}`);
}

/**
 * POST /auth/login-internal
 * Login Pemilik atau Staf Dapur
 */
function prosesLoginInternal(req, res) {
  const { username, password, roleTarget } = req.body;
  const akun = userModel.autentikasiInternal(username, password);

  if (!akun) {
    return res.status(401).render('login', {
      halamanAktif: 'login',
      appConfig,
      roleAwal: roleTarget || 'pemilik',
      pesanError: 'Username atau kata sandi tidak cocok. Silakan coba kembali.',
      mejaParam: '04'
    });
  }

  const token = buatTokenAman({
    id: akun.id,
    username: akun.username,
    role: akun.role,
    loginAt: new Date().toISOString()
  });

  res.setHeader(
    'Set-Cookie',
    `${COOKIE_INTERNAL}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`
  );

  return res.redirect(akun.halamanUtama);
}

/**
 * GET /logout & POST /auth/logout
 */
function prosesLogout(req, res) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_INTERNAL}=; Path=/; HttpOnly; Max-Age=0`,
    `${COOKIE_PELANGGAN}=; Path=/; HttpOnly; Max-Age=0`
  ]);
  return res.redirect('/login');
}

module.exports = {
  renderHalamanLogin,
  prosesLoginPelanggan,
  prosesLoginInternal,
  prosesLogout
};
