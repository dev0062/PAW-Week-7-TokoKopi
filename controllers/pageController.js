/**
 * ============================================================================
 * FILE: controllers/pageController.js
 * ============================================================================
 * Referensi PRD:
 * - Bagian 4 (Target User / Persona) & Bagian 7 (In Scope A, B, C):
 *   1. Halaman Pelanggan (Evan Vijaya Putra)  -> GET / (Scope A)
 *   2. Halaman Staf Dapur (Nazhat Hafidz)     -> GET /staf (Scope B)
 *   3. Halaman Pemilik (Dev Yuftiana Ayyun)   -> GET /pemilik (Scope C)
 * ============================================================================
 */

const appConfig = require('../config/appConfig');
const menuModel = require('../models/menuModel');
const orderModel = require('../models/orderModel');
const { QUICK_REPLIES_STANDAR } = require('../utils/aiAgent');
const {
  formatRupiah,
  formatJamMenit,
  formatTanggalLaporan,
  hitungWaktuTunggu
} = require('../utils/formatter');

/**
 * Scope A (US-01-1 s/d US-01-5):
 * Merender halaman pemesanan mandiri pelanggan dari meja (Scan QR Code)
 * beserta jendela Asisten Chatbot interaktif.
 */
function renderHalamanPelanggan(req, res, next) {
  try {
    // US-01-1: Prioritaskan nomor meja dari QR Code (?meja=XX) atau dari sesi Check-In Meja
    const rawMeja =
      req.query.meja ||
      (req.pelanggan && req.pelanggan.nomorMeja) ||
      appConfig.mejaDefault;

    const nomorMeja = String(
      Math.min(appConfig.jumlahMeja, Math.max(1, Number(rawMeja) || 4))
    ).padStart(2, '0');

    const namaPelangganAktif =
      (req.pelanggan && req.pelanggan.namaPelanggan) ||
      'Evan Vijaya Putra';

    const semuaMenu = menuModel.getAllMenu();
    const menuTersedia = menuModel.getMenuTersedia();
    const kategoriList = menuModel.getKategoriList();
    const tigaTerlaris = menuModel.getRekomendasiTerlarisTersedia(3);
    const pesananMejaIni = orderModel.getPesananByMeja(nomorMeja);

    res.render('pelanggan', {
      halamanAktif: 'pelanggan',
      appConfig,
      nomorMeja,
      namaPelangganAktif,
      semuaMenu,
      menuTersedia,
      kategoriList,
      tigaTerlaris,
      pesananMejaIni,
      quickReplies: QUICK_REPLIES_STANDAR,
      formatRupiah,
      formatJamMenit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Scope B (US-03-1 s/d US-03-5):
 * Merender halaman operasional Staf Dapur (Nazhat Hafidz Al Jauzi) untuk:
 * - Melihat antrean pesanan masuk secara FIFO beserta nomor meja & waktu tunggu
 * - Mengubah status pesanan menjadi "Sedang Diproses" atau "Siap Diantar"
 * - Menginput kuota porsi stok awal & tombol 1-klik "Habis"
 */
function renderHalamanStaf(req, res, next) {
  try {
    const semuaMenu = menuModel.getAllMenu();
    const kategoriList = menuModel.getKategoriList();
    const antreanAktif = orderModel.getAntreanAktifFIFO();
    const riwayatSelesai = orderModel.getRiwayatPesananSelesai();
    const menuKritis = menuModel.getMenuPerluPerhatianStok();
    const pesanAksesDitolak =
      req.query.akses === 'ditolak'
        ? 'Halaman Laporan Penjualan Harian hanya dapat diakses oleh akun Pemilik (Dev Yuftiana Ayyun).'
        : '';

    res.render('staf', {
      halamanAktif: 'staf',
      appConfig,
      semuaMenu,
      kategoriList,
      antreanAktif,
      riwayatSelesai,
      menuKritis,
      pesanAksesDitolak,
      formatRupiah,
      formatJamMenit,
      hitungWaktuTunggu
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Scope C (US-02-1 s/d US-02-5):
 * Merender halaman Dashboard Laporan Pemilik (Dev Yuftiana Ayyun) untuk:
 * - Melihat peringkat otomatis menu paling laku setiap hari (US-02-1)
 * - Memantau sisa stok bahan baku secara langsung saat jam ramai (US-02-2)
 * - Melihat peringatan merah "Stok Menipis" untuk stok <= 5 porsi (US-02-3)
 * - Melihat riwayat menu yang paling sering dicari di Chatbot saat habis (US-02-4)
 * - Mencetak / mengunduh rekap laporan harian PDF & Excel/CSV (US-02-5)
 */
function renderHalamanPemilik(req, res, next) {
  try {
    const filterWaktu = req.query.periode || 'hari-ini';
    const peringkatMenu = menuModel.getPeringkatMenuTerlaris();
    const menuStokKritis = menuModel.getMenuPerluPerhatianStok();
    const riwayatDicariHabis = menuModel.getRiwayatMenuDicariSaatHabis();
    const semuaPesanan = orderModel.getAllPesanan();

    // Kalkulasi ringkasan eksekutif untuk pemilik
    const totalPorsiTerjual = peringkatMenu.reduce(
      (sum, item) => sum + item.terjualHariIni,
      0
    );
    const totalPendapatanHarian = peringkatMenu.reduce(
      (sum, item) => sum + item.omzetHariIni,
      0
    );
    const totalSisaStok = peringkatMenu.reduce(
      (sum, item) => sum + item.stok,
      0
    );
    const totalPencarianMenuHabis = peringkatMenu.reduce(
      (sum, item) => sum + item.dicariSaatHabis,
      0
    );

    res.render('pemilik', {
      halamanAktif: 'pemilik',
      appConfig,
      filterWaktu,
      tanggalLaporan: formatTanggalLaporan(new Date()),
      peringkatMenu,
      menuStokKritis,
      riwayatDicariHabis,
      semuaPesanan,
      ringkasan: {
        totalPorsiTerjual,
        totalPendapatanHarian,
        totalSisaStok,
        jumlahMenuKritis: menuStokKritis.length,
        totalPencarianMenuHabis,
        menuTerlarisUtama: peringkatMenu[0] || null
      },
      formatRupiah,
      formatJamMenit
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  renderHalamanPelanggan,
  renderHalamanStaf,
  renderHalamanPemilik
};
