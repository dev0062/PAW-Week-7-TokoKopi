/**
 * ============================================================================
 * FILE: routes/appRoutes.js
 * ============================================================================
 * Definisi Endpoint Routing (MVC):
 * 1. Route Autentikasi (Login & Logout)
 * 2. Route Halaman Frontend (EJS)
 * 3. Route REST API CRUD Produk/Menu (Terhubung ke PostgreSQL via Sequelize)
 * 4. Route API Operasional (Chatbot AI, Pesanan FIFO, Stok Cepat, Export CSV)
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
router.get('/login', authController.renderHalamanLogin);
router.post('/auth/login-pelanggan', authController.prosesLoginPelanggan);
router.post('/auth/login-internal', authController.prosesLoginInternal);
router.get('/logout', authController.prosesLogout);
router.post('/auth/logout', authController.prosesLogout);

// ============================================================================
// 2. ROUTE HALAMAN WEB (TERPROTEKSI SESUAI PERAN)
// ============================================================================
router.get('/', requirePelanggan, pageController.renderHalamanPelanggan);
router.get('/staf', requireRole(['staf', 'pemilik']), pageController.renderHalamanStaf);
router.get('/pemilik', requireRole(['pemilik']), pageController.renderHalamanPemilik);

// ============================================================================
// 3. ROUTE REST API CRUD (Sesuai Modul Praktikum Bagian 2 & 4)
//    Dapat diuji langsung menggunakan Postman / Thunder Client & Frontend
// ============================================================================

// Endpoint CRUD Resource `/api/produk` (Sesuai ilustrasi modul praktikum)
router.get('/api/produk', apiController.getAllProduk);
router.get('/api/produk/:id', apiController.getProdukById);
router.post('/api/produk', apiController.createProduk);
router.put('/api/produk/:id', apiController.updateProduk);
router.delete('/api/produk/:id', apiController.deleteProduk);

// Alias Endpoint CRUD Resource `/api/menu` (Sesuai tema project restoran/kafe)
router.get('/api/menu', apiController.getAllProduk);
router.get('/api/menu/:id', apiController.getProdukById);
router.post('/api/menu', apiController.createProduk);
router.put('/api/menu/:id', apiController.updateProduk);
router.delete('/api/menu/:id', apiController.deleteProduk);

// ============================================================================
// 4. ROUTE API OPERASIONAL & STATUS SISTEM
// ============================================================================
router.get('/api/status', apiController.getStatusSistem);
router.get('/api/sinkronisasi', apiController.getSinkronisasiData);

// API Chatbot & Pesanan Pelanggan
router.post('/api/chat', apiController.postChatMessage);
router.post('/api/pesanan', apiController.postBuatPesanan);
router.get('/api/pesanan/:nomorAntrean', apiController.getStatusPesanan);

// API Operasional Dapur Staf
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

// API Laporan Pemilik
router.get(
  '/api/laporan/export-csv',
  requireRole(['pemilik']),
  apiController.getExportLaporanCsv
);

module.exports = router;
