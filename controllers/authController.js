/**
 * ============================================================================
 * FILE: controllers/authController.js
 * ============================================================================
 * FUNGSI:
 * Mengatur alur autentikasi yang TERPISAH antara:
 * 1. Halaman Check-In Meja Pelanggan (Customer QR Scan):
 *    - URL: GET /masuk-meja (atau GET /login)
 *    - View: `views/login.ejs` (Murni untuk pelanggan meja tanpa form pegawai)
 * 2. Halaman Portal Manajemen Internal (Staf Dapur & Pemilik Kedai):
 *    - URL: GET /portal-internal (atau GET /staff)
 *    - View: `views/login-internal.ejs` (Khusus autentikasi Staf & Pemilik)
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
 * GET /masuk-meja & GET /login
 * Merender halaman khusus Check-In Meja Pelanggan (Scope A - Evan Vijaya Putra).
 * Jika ada query `?role=staf` atau `?role=pemilik`, otomatis dialihkan ke `/portal-internal`.
 */
function renderHalamanMasukPelanggan(req, res) {
  if (req.query.role === 'staf' || req.query.role === 'pemilik') {
    return res.redirect(`/portal-internal?role=${req.query.role}`);
  }

  // Jika pelanggan sudah check-in meja dan tidak sedang meminta ganti meja
  if (req.pelanggan && !req.query.ganti) {
    return res.redirect('/');
  }

  const pesanError = req.query.error || '';
  const mejaParam = req.query.meja || (req.pelanggan ? req.pelanggan.nomorMeja : '04');

  return res.render('login', {
    halamanAktif: 'login-pelanggan',
    appConfig,
    statusToko: appConfig.getStatusToko(),
    pesanError,
    mejaParam
  });
}

/**
 * GET /portal-internal & GET /staff
 * Merender halaman khusus Login Pegawai Internal (Staf Dapur & Pemilik Kedai).
 */
function renderHalamanLoginInternal(req, res) {
  // Jika sudah login sebagai staf/pemilik dan tidak sedang meminta ganti akun
  if (req.user && !req.query.ganti) {
    return res.redirect(req.user.halamanUtama);
  }

  const roleAwal = req.query.role === 'staf' ? 'staf' : 'pemilik';
  const pesanError = req.query.error || '';

  return res.render('login-internal', {
    halamanAktif: 'login-internal',
    appConfig,
    roleAwal,
    pesanError
  });
}

/**
 * POST /auth/login-pelanggan
 * Memproses check-in meja pelanggan menggunakan Nama Pemesan & Nomor Meja.
 */
function prosesLoginPelanggan(req, res) {
  const { namaPelanggan, nomorMeja } = req.body;
  const nama = String(namaPelanggan || '').trim();
  const meja = String(
    Math.min(appConfig.jumlahMeja, Math.max(1, Number(nomorMeja) || 4))
  ).padStart(2, '0');

  const statusToko = appConfig.getStatusToko();

  // Validasi 1: Nama Pemesan tidak boleh kosong dan minimal 2 karakter
  if (!nama || nama.length < 2) {
    return res.status(400).render('login', {
      halamanAktif: 'login-pelanggan',
      appConfig,
      statusToko,
      pesanError: 'Nama pemesan wajib diisi minimal 2 huruf.',
      mejaParam: meja
    });
  }

  // Validasi 2: Nama Pemesan hanya boleh berisi huruf, spasi, titik, apostrof, atau tanda hubung (Tidak boleh angka/simbol)
  const regexNamaValid = /^[a-zA-Z\s.'-]+$/;
  if (!regexNamaValid.test(nama) || nama.length > 60) {
    return res.status(400).render('login', {
      halamanAktif: 'login-pelanggan',
      appConfig,
      statusToko,
      pesanError: 'Nama pemesan hanya boleh menggunakan huruf (tidak boleh menggunakan angka atau simbol khusus).',
      mejaParam: meja
    });
  }

  // Validasi 3: Nomor meja harus berupa angka 1 s/d jumlahMeja
  const angkaMejaInput = Number(nomorMeja);
  if (!Number.isInteger(angkaMejaInput) || angkaMejaInput < 1 || angkaMejaInput > appConfig.jumlahMeja) {
    return res.status(400).render('login', {
      halamanAktif: 'login-pelanggan',
      appConfig,
      statusToko,
      pesanError: `Nomor meja tidak valid. Pilih nomor meja antara 01 sampai ${appConfig.jumlahMeja}.`,
      mejaParam: '04'
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
 * Memproses login untuk akun Pemilik (Dev Yuftiana Ayyun) atau Staf Dapur (Nazhat Hafidz).
 */
function prosesLoginInternal(req, res) {
  const { username, password, roleTarget } = req.body;
  const akun = userModel.autentikasiInternal(username, password);

  if (!akun) {
    return res.status(401).render('login-internal', {
      halamanAktif: 'login-internal',
      appConfig,
      roleAwal: roleTarget === 'staf' ? 'staf' : 'pemilik',
      pesanError: 'Username atau kata sandi pegawai tidak sesuai. Silakan periksa kembali.'
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
 * Menghapus cookie sesi dan mengarahkan kembali sesuai peran terakhir pengguna:
 * - Jika yang logout adalah Staf/Pemilik -> kembali ke `/portal-internal`
 * - Jika yang logout adalah Pelanggan Meja -> kembali ke `/masuk-meja`
 */
function prosesLogout(req, res) {
  const isInternalUser = Boolean(req.user) || req.query.from === 'internal';

  res.setHeader('Set-Cookie', [
    `${COOKIE_INTERNAL}=; Path=/; HttpOnly; Max-Age=0`,
    `${COOKIE_PELANGGAN}=; Path=/; HttpOnly; Max-Age=0`
  ]);

  if (isInternalUser) {
    return res.redirect('/portal-internal');
  }
  return res.redirect('/masuk-meja');
}

module.exports = {
  renderHalamanLogin: renderHalamanMasukPelanggan,
  renderHalamanMasukPelanggan,
  renderHalamanLoginInternal,
  prosesLoginPelanggan,
  prosesLoginInternal,
  prosesLogout
};
