/**
 * ============================================================================
 * FILE: controllers/apiController.js
 * ============================================================================
 * Controller REST API untuk:
 * 1. Operasi CRUD Produk/Menu ke Database PostgreSQL via Sequelize:
 *    - GET    /api/produk       (dan /api/menu)
 *    - GET    /api/produk/:id   (dan /api/menu/:id)
 *    - POST   /api/produk       (dan /api/menu)
 *    - PUT    /api/produk/:id   (dan /api/menu/:id)
 *    - DELETE /api/produk/:id   (dan /api/menu/:id)
 * 2. Endpoint Operasional Devtech (Chatbot AI, Antrean FIFO, Stok 1-Klik, CSV).
 * ============================================================================
 */

const appConfig = require('../config/appConfig');
const menuModel = require('../models/menuModel');
const orderModel = require('../models/orderModel');
const { prosesPesanPelanggan } = require('../utils/aiAgent');
const { hitungWaktuTunggu } = require('../utils/formatter');

// ============================================================================
// 1. ENDPOINT CRUD UTAMA (Terhubung ke PostgreSQL via Sequelize Model)
// ============================================================================

/**
 * GET /api/produk (atau GET /api/menu)
 * Mengambil dan menampilkan seluruh data produk/menu dari database PostgreSQL.
 */
async function getAllProduk(req, res, next) {
  try {
    const data = await menuModel.findAllFromDb();
    return res.status(200).json({
      sukses: true,
      pesan: 'Berhasil mengambil seluruh data menu dari database.',
      total: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/produk/:id (atau GET /api/menu/:id)
 * Mengambil detail satu data produk/menu berdasarkan ID dari database PostgreSQL.
 */
async function getProdukById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await menuModel.findByIdFromDb(id);

    if (!item) {
      return res.status(404).json({
        sukses: false,
        pesanError: `Data menu/produk dengan ID ${id} tidak ditemukan di database.`
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: `Berhasil mengambil detail menu ID ${id}.`,
      data: item
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/produk (atau POST /api/menu)
 * Menambahkan data menu/produk baru ke dalam database PostgreSQL.
 */
async function createProduk(req, res, next) {
  try {
    const { nama, kategori, harga, deskripsi, stok, stokAwal, gambar } = req.body;

    if (!nama || String(nama).trim().length < 2) {
      return res.status(400).json({
        sukses: false,
        pesanError: 'Nama menu/produk wajib diisi (minimal 2 karakter).'
      });
    }

    const menuBaru = await menuModel.createInDb({
      nama,
      kategori,
      harga,
      deskripsi,
      stok: stok !== undefined ? stok : stokAwal,
      stokAwal: stokAwal !== undefined ? stokAwal : stok,
      gambar
    });

    return res.status(201).json({
      sukses: true,
      pesan: `Menu "${menuBaru.nama}" berhasil ditambahkan ke database PostgreSQL.`,
      data: menuBaru,
      menu: menuBaru,
      semuaMenu: menuModel.getAllMenu()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/produk/:id (atau PUT /api/menu/:id)
 * Memperbarui data produk/menu berdasarkan ID di dalam database PostgreSQL.
 */
async function updateProduk(req, res, next) {
  try {
    const { id } = req.params;
    const { nama, kategori, harga, deskripsi, stok, stokAwal, gambar } = req.body;

    const menuDiperbarui = await menuModel.updateInDb(id, {
      nama,
      kategori,
      harga,
      deskripsi,
      stok,
      stokAwal,
      gambar
    });

    if (!menuDiperbarui) {
      return res.status(404).json({
        sukses: false,
        pesanError: `Data menu/produk dengan ID ${id} tidak ditemukan di database.`
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: `Data menu "${menuDiperbarui.nama}" (ID: ${id}) berhasil diperbarui di database.`,
      data: menuDiperbarui,
      menu: menuDiperbarui,
      semuaMenu: menuModel.getAllMenu()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/produk/:id (atau DELETE /api/menu/:id)
 * Menghapus data produk/menu berdasarkan ID dari database PostgreSQL.
 */
async function deleteProduk(req, res, next) {
  try {
    const { id } = req.params;
    const menuDihapus = await menuModel.deleteFromDb(id);

    if (!menuDihapus) {
      return res.status(404).json({
        sukses: false,
        pesanError: `Data menu/produk dengan ID ${id} tidak ditemukan di database.`
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: `Menu "${menuDihapus.nama}" (ID: ${id}) berhasil dihapus dari database PostgreSQL.`,
      data: menuDihapus,
      semuaMenu: menuModel.getAllMenu()
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 2. ENDPOINT OPERASIONAL DEVTECH (Chatbot, Pesanan FIFO, Stok Cepat, Laporan)
// ============================================================================

/**
 * POST /api/chat
 * Memproses pertanyaan pelanggan di Chatbot (tanya stok, rekomendasi pengganti,
 * atau cek status pesanan) dalam waktu < 2 detik (Metrik M-04).
 */
async function postChatMessage(req, res, next) {
  try {
    const { pesan, nomorMeja, nomorAntreanAktif } = req.body;

    if (!pesan || String(pesan).trim() === '') {
      return res.status(400).json({
        sukses: false,
        pesanError: 'Pesan pertanyaan tidak boleh kosong.'
      });
    }

    const hasilRespon = await prosesPesanPelanggan({
      pesan,
      nomorMeja: nomorMeja || appConfig.mejaDefault,
      nomorAntreanAktif
    });

    return res.status(200).json({
      sukses: true,
      ...hasilRespon
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/pesanan
 * Menyimpan pesanan mandiri dari meja/Chatbot ke database PostgreSQL,
 * mengurangi stok otomatis, dan meneruskan ke layar dapur staf.
 */
async function postBuatPesanan(req, res, next) {
  try {
    const { nomorMeja, namaPelanggan, items, catatan, sumberPesan } = req.body;

    const hasil = await orderModel.buatPesananBaru({
      nomorMeja,
      namaPelanggan,
      items,
      catatan,
      sumberPesan: sumberPesan || 'Chatbot Meja'
    });

    if (!hasil.sukses) {
      return res.status(400).json({
        sukses: false,
        pesanError: hasil.pesanError,
        rekomendasiPengganti: hasil.rekomendasiPengganti || [],
        semuaMenuTerbaru: menuModel.getAllMenu()
      });
    }

    return res.status(201).json({
      sukses: true,
      pesanan: hasil.pesanan,
      semuaMenuTerbaru: menuModel.getAllMenu()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/pesanan/:nomorAntrean
 */
function getStatusPesanan(req, res) {
  const { nomorAntrean } = req.params;
  const pesanan = orderModel.getPesananByNomorAntrean(nomorAntrean);

  if (!pesanan) {
    return res.status(404).json({
      sukses: false,
      pesanError: `Nomor antrean ${nomorAntrean} tidak ditemukan.`
    });
  }

  return res.status(200).json({
    sukses: true,
    pesanan
  });
}

/**
 * PATCH /api/stok/:menuId/toggle-habis
 */
async function patchToggleMenuHabis(req, res, next) {
  try {
    const { menuId } = req.params;
    const { paksaHabis } = req.body || {};

    const menuTerbaru = await menuModel.toggleStatusHabis(menuId, paksaHabis);
    if (!menuTerbaru) {
      return res.status(404).json({
        sukses: false,
        pesanError: 'Data menu tidak ditemukan.'
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: `Status stok "${menuTerbaru.nama}" berhasil diperbarui menjadi ${menuTerbaru.labelStok} (${menuTerbaru.stok} porsi).`,
      menu: menuTerbaru,
      semuaMenu: menuModel.getAllMenu()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/stok/:menuId/kuota
 */
async function patchUpdateKuotaStok(req, res, next) {
  try {
    const { menuId } = req.params;
    const { stok } = req.body;

    if (stok === undefined || Number.isNaN(Number(stok)) || Number(stok) < 0) {
      return res.status(400).json({
        sukses: false,
        pesanError: 'Masukkan angka jumlah porsi stok yang valid (minimal 0).'
      });
    }

    const menuTerbaru = await menuModel.updateKuotaStok(menuId, Number(stok));
    if (!menuTerbaru) {
      return res.status(404).json({
        sukses: false,
        pesanError: 'Menu tidak ditemukan.'
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: `Kuota stok "${menuTerbaru.nama}" disimpan sebanyak ${menuTerbaru.stok} porsi.`,
      menu: menuTerbaru,
      semuaMenu: menuModel.getAllMenu()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/stok/tambah
 */
async function postTambahMenuBaru(req, res, next) {
  return createProduk(req, res, next);
}

/**
 * PATCH /api/pesanan/:nomorAntrean/status
 */
async function patchStatusPesananDapur(req, res, next) {
  try {
    const { nomorAntrean } = req.params;
    const { status } = req.body;

    const pesananTerbaru = await orderModel.updateStatusPesanan(nomorAntrean, status);
    if (!pesananTerbaru) {
      return res.status(404).json({
        sukses: false,
        pesanError: 'Pesanan tidak ditemukan atau status tidak valid.'
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: `Status pesanan ${pesananTerbaru.nomorAntrean} (Meja ${pesananTerbaru.nomorMeja}) diubah menjadi "${pesananTerbaru.status}".`,
      pesanan: pesananTerbaru
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/sinkronisasi
 */
async function getSinkronisasiData(req, res, next) {
  try {
    const semuaMenu = await menuModel.findAllFromDb();
    const antreanAktif = orderModel.getAntreanAktifFIFO().map((p) => ({
      ...p,
      labelWaktuTunggu: hitungWaktuTunggu(p.waktuPesan)
    }));
    const riwayatSelesai = orderModel.getRiwayatPesananSelesai();
    const peringkatMenu = menuModel.getPeringkatMenuTerlaris();
    const riwayatDicariHabis = menuModel.getRiwayatMenuDicariSaatHabis();

    res.status(200).json({
      sukses: true,
      waktuServer: new Date().toISOString(),
      antreanAktif,
      riwayatSelesai,
      semuaMenu,
      peringkatMenu,
      riwayatDicariHabis
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/laporan/export-csv
 */
function getExportLaporanCsv(req, res) {
  const peringkatMenu = menuModel.getPeringkatMenuTerlaris();
  const tanggalStr = new Date().toISOString().slice(0, 10);

  const headerCsv = [
    'Peringkat',
    'Kode Menu',
    'Nama Menu',
    'Kategori',
    'Harga Satuan (Rp)',
    'Stok Awal (Porsi)',
    'Terjual Hari Ini (Porsi)',
    'Sisa Stok (Porsi)',
    'Status Ketersediaan',
    'Dicari Saat Habis (Kali)',
    'Total Omzet (Rp)'
  ].join(',');

  const barisCsv = peringkatMenu.map((item) => {
    const namaAman = `"${String(item.nama).replace(/"/g, '""')}"`;
    const kategoriAman = `"${String(item.kategori).replace(/"/g, '""')}"`;
    return [
      item.peringkat,
      item.kode,
      namaAman,
      kategoriAman,
      item.harga,
      item.stokAwal,
      item.terjualHariIni,
      item.stok,
      `"${item.labelStok}"`,
      item.dicariSaatHabis,
      item.omzetHariIni
    ].join(',');
  });

  const kontenCsv = '\uFEFF' + [headerCsv, ...barisCsv].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Laporan-Harian-Devtech-${tanggalStr}.csv"`
  );
  return res.status(200).send(kontenCsv);
}

/**
 * GET /api/status
 * Pemeriksaan kesehatan server & koneksi database PostgreSQL.
 */
function getStatusSistem(req, res) {
  res.status(200).json({
    status: 'aktif',
    produk: appConfig.appName,
    versi: appConfig.version,
    databaseConnected: menuModel.isDatabaseConnected(),
    dialect: 'postgres (Sequelize ORM)',
    waktu: new Date().toISOString()
  });
}

module.exports = {
  // CRUD Endpoints
  getAllProduk,
  getProdukById,
  createProduk,
  updateProduk,
  deleteProduk,
  // Operational Endpoints
  postChatMessage,
  postBuatPesanan,
  getStatusPesanan,
  patchToggleMenuHabis,
  patchUpdateKuotaStok,
  postTambahMenuBaru,
  patchStatusPesananDapur,
  getSinkronisasiData,
  getExportLaporanCsv,
  getStatusSistem
};
