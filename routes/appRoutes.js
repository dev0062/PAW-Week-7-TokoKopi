/**
 * ============================================================================
 * FILE: routes/appRoutes.js
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const apiController = require('../controllers/apiController');
const authController = require('../controllers/authController');
const { requirePelanggan, requireRole } = require('../middlewares/authMiddleware');

// ============================================================================
// 1. ROUTE AUTENTIKASI (LOGIN & LOGOUT)
// ============================================================================

// Halaman Login Utama (Pintu Masuk Wajib Sistem)
router.get('/login', authController.renderHalamanLogin);

// Submit Login Pelanggan (Masuk Meja)
router.post('/auth/login-pelanggan', authController.prosesLoginPelanggan);

// Submit Login Pemilik & Staf
router.post('/auth/login-internal', authController.prosesLoginInternal);

// Logout
router.get('/logout', authController.prosesLogout);
router.post('/auth/logout', authController.prosesLogout);

// ============================================================================
// 2. ROUTE HALAMAN WEB (SEMUA TERPROTEKSI LOGIN - TIDAK BISA LANGSUNG BUKA)
// ============================================================================

// Halaman Pelanggan (Wajib Login Pelanggan / Masuk Meja Terlebih Dahulu)
router.get('/', requirePelanggan, pageController.renderHalamanPelanggan);

// Halaman Staf Dapur (Wajib Login Akun Staf / Pemilik)
router.get('/staf', requireRole(['staf', 'pemilik']), pageController.renderHalamanStaf);

// Halaman Pemilik (Wajib Login Akun Pemilik)
router.get('/pemilik', requireRole(['pemilik']), pageController.renderHalamanPemilik);

// ============================================================================
// 3. ROUTE API
// ============================================================================

router.get('/api/status', apiController.getStatusSistem);
router.get('/api/sinkronisasi', apiController.getSinkronisasiData);

// API Chatbot & Pesanan Pelanggan
router.post('/api/chat', apiController.postChatMessage);
router.post('/api/pesanan', apiController.postBuatPesanan);
router.get('/api/pesanan/:nomorAntrean', apiController.getStatusPesanan);

// API Dapur Staf (Wajib Akun Staf/Pemilik)
router.patch(
  '/api/pesanan/:nomorAntrean/status',
  requireRole(['staf', 'pemilik']),
  apiController.patchStatusPesananDapur
);
router.patch(
  '/api/stok/:menuId/toggle-habis',
  requireRole(['staf', 'pemilik']),
  apiController.patchToggleMenuHabis
);
router.patch(
  '/api/stok/:menuId/kuota',
  requireRole(['staf', 'pemilik']),
  apiController.patchUpdateKuotaStok
);
router.post(
  '/api/stok/tambah',
  requireRole(['staf', 'pemilik']),
  apiController.postTambahMenuBaru
);

// API Laporan Pemilik (Wajib Akun Pemilik)
router.get(
  '/api/laporan/export-csv',
  requireRole(['pemilik']),
  apiController.getExportLaporanCsv
);

module.exports = router;
