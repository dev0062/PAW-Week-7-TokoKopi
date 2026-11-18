/**
 * ============================================================================
 * FILE: app.js
 * ============================================================================
 * Entry Point Aplikasi Web Devtech (v1.0)
 * Penulis PRD : Dev Alldino Zain (20240140260)
 * Arsitektur  : MVC (Model-View-Controller) berbasis Node.js, Express, EJS & Sequelize (PostgreSQL)
 * ============================================================================
 */

const path = require('path');
require('dotenv').config();
const express = require('express');
const appConfig = require('./config/appConfig');
const { sequelize, ensureDatabaseExists } = require('./config/database');
const menuModel = require('./models/menuModel');
const orderModel = require('./models/orderModel');
const requestLogger = require('./middlewares/requestLogger');
const { attachSession } = require('./middlewares/authMiddleware');
const chatRoutes = require('./routes/chat.routes');
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

// Pendaftaran Route AI Assistant (POST /api/chat -> validateChatInput -> chat.controller -> gemini.service)
app.use('/', chatRoutes);

// Pendaftaran Seluruh Route MVC (Halaman & API CRUD)
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

// Inisialisasi Database PostgreSQL (Sequelize) & Menjalankan Server
async function startServer() {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('[Sequelize] Koneksi ke PostgreSQL berhasil terhubung.');
    await menuModel.initMenuTable();
    await orderModel.initOrderTable();
  } catch (dbErr) {
    console.warn('[Sequelize] Peringatan koneksi PostgreSQL (pastikan DB_PASSWORD di .env sesuai pgAdmin):', dbErr.message);
  }

  app.listen(appConfig.port, '0.0.0.0', () => {
    console.log('==============================================================');
    console.log(` ${appConfig.appName} ${appConfig.version} — ${appConfig.brandSubtitle}`);
    console.log(` Penulis PRD : ${appConfig.authorName} (${appConfig.authorNim})`);
    console.log(` Server URL  : http://localhost:${appConfig.port}`);
    console.log('--------------------------------------------------------------');
    console.log(` [1. Link Customer Meja]      : http://localhost:${appConfig.port}/masuk-meja`);
    console.log(` [2. Link Pemilik & Staf]     : http://localhost:${appConfig.port}/portal-internal`);
    console.log(` [Akses via HP (Wi-Fi Sama)]  : http://10.10.0.90:${appConfig.port}/masuk-meja`);
    console.log('==============================================================');
  });
}

startServer();
