/**
 * ============================================================================
 * FILE: app.js
 * ============================================================================
 * Entry Point Aplikasi Web Devtech (v1.0)
 * Penulis PRD : Dev Alldino Zain (20240140260)
 * Arsitektur  : MVC (Model-View-Controller) berbasis Node.js, Express, & EJS
 * Cakupan PRD :
 * - Scope A: Pemesanan Mandiri Meja & Chatbot Pelanggan (GET /)
 * - Scope B: Layar Antrean Dapur FIFO & Kelola Stok Staf (GET /staf - Terproteksi)
 * - Scope C: Dashboard Menu Paling Laku & Pantauan Stok Pemilik (GET /pemilik - Terproteksi)
 * - Portal Masuk: Check-In Meja Pelanggan & Login Staf/Pemilik (GET /login)
 * ============================================================================
 */

const path = require('path');
require('dotenv').config();
const express = require('express');
const appConfig = require('./config/appConfig');
const requestLogger = require('./middlewares/requestLogger');
const { attachSession } = require('./middlewares/authMiddleware');
const appRoutes = require('./routes/appRoutes');

const app = express();

// Keamanan dasar HTTP header
app.disable('x-powered-by');

// Konfigurasi View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rangkaian Middleware Utama
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachSession);

// Pendaftaran Seluruh Route MVC (Halaman & API)
app.use('/', appRoutes);

// Handler 404 (Halaman / Endpoint Tidak Ditemukan)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      sukses: false,
      pesanError: `Endpoint ${req.originalUrl} tidak ditemukan.`
    });
  }

  return res.status(404).render('404', {
    appConfig,
    urlTidakDikenal: req.originalUrl || req.url
  });
});

// Global Error Handler 500
app.use((err, req, res, next) => {
  console.error('[DEVTECH SERVER ERROR]', err.stack || err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      sukses: false,
      pesanError: 'Terjadi kesalahan internal pada server Devtech.'
    });
  }

  return res.status(500).render('500', {
    appConfig,
    pesanError: 'Maaf, terjadi gangguan saat memproses permintaan Anda. Silakan muat ulang halaman.'
  });
});

// Menjalankan Server
app.listen(appConfig.port, () => {
  console.log('==============================================================');
  console.log(` ${appConfig.appName} ${appConfig.version} — ${appConfig.brandSubtitle}`);
  console.log(` Penulis PRD : ${appConfig.authorName} (${appConfig.authorNim})`);
  console.log(` Server URL  : http://localhost:${appConfig.port}`);
  console.log('--------------------------------------------------------------');
  console.log(` [Scope A] Meja Pelanggan (QR)      : http://localhost:${appConfig.port}/?meja=04`);
  console.log(` [Portal]  Login Staf & Pemilik     : http://localhost:${appConfig.port}/login`);
  console.log(` [Scope B] Layar Staf Dapur & Stok  : http://localhost:${appConfig.port}/staf`);
  console.log(` [Scope C] Dashboard Laporan Pemilik: http://localhost:${appConfig.port}/pemilik`);
  console.log('==============================================================');
});
