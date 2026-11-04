/**
 * ============================================================================
 * FILE: controllers/apiController.js
 * ============================================================================
 * Referensi PRD:
 * - F-01 (US-01-1 s/d US-01-4, M-04): Endpoint interaksi Chatbot & pemesanan meja.
 * - F-02 (US-03-1, US-03-2): Endpoint 1-klik toggle menu "Habis" & update kuota stok.
 * - F-03 (US-03-3 s/d US-03-5): Endpoint sinkronisasi antrean dapur & update status.
 * - F-04 & F-05 (US-01-5, US-02-1 s/d US-02-4): Endpoint polling real-time status
 *   pesanan pelanggan & pantauan stok pemilik.
 * - F-06 (US-02-5): Endpoint export laporan penjualan & sisa stok harian (CSV/Excel).
 * ============================================================================
 */

const appConfig = require('../config/appConfig');
const menuModel = require('../models/menuModel');
const orderModel = require('../models/orderModel');
const { prosesPesanPelanggan } = require('../utils/aiAgent');
const { hitungWaktuTunggu } = require('../utils/formatter');

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
 * US-01-4 & Mitigasi Risiko 2:
 * Menyimpan pesanan mandiri dari meja/Chatbot, mengurangi stok otomatis,
 * menghasilkan nomor antrean, dan meneruskan ke layar dapur staf.
 */
function postBuatPesanan(req, res, next) {
  try {
    const { nomorMeja, namaPelanggan, items, catatan, sumberPesan } = req.body;

    const hasil = orderModel.buatPesananBaru({
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
 * US-01-5:
 * Digunakan oleh ruang Chatbot pelanggan untuk mengecek pembaruan status
 * pesanan ("Sedang Diproses" / "Siap Diantar") secara real-time.
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
 * US-03-1 & F-02:
 * Staf mengubah status menu menjadi "Habis" dalam satu klik (< 2 detik)
 * agar pelanggan di meja & Chatbot tidak dapat memesan menu tersebut.
 */
function patchToggleMenuHabis(req, res) {
  const { menuId } = req.params;
  const { paksaHabis } = req.body || {};

  const menuTerbaru = menuModel.toggleStatusHabis(menuId, paksaHabis);
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
}

/**
 * PATCH /api/stok/:menuId/kuota
 * US-03-2 & F-02:
 * Staf menginput angka jumlah porsi stok awal/tambahan lalu klik "Simpan".
 */
function patchUpdateKuotaStok(req, res) {
  const { menuId } = req.params;
  const { stok } = req.body;

  if (stok === undefined || Number.isNaN(Number(stok)) || Number(stok) < 0) {
    return res.status(400).json({
      sukses: false,
      pesanError: 'Masukkan angka jumlah porsi stok yang valid (minimal 0).'
    });
  }

  const menuTerbaru = menuModel.updateKuotaStok(menuId, Number(stok));
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
}

/**
 * POST /api/stok/tambah
 * F-02 (CRUD Stok Menu): Menambahkan menu baru beserta stok awalnya.
 */
function postTambahMenuBaru(req, res) {
  const { nama, kategori, harga, deskripsi, stokAwal } = req.body;

  if (!nama || String(nama).trim().length < 3) {
    return res.status(400).json({
      sukses: false,
      pesanError: 'Nama menu baru wajib diisi (minimal 3 karakter).'
    });
  }

  const menuBaru = menuModel.tambahMenuBaru({
    nama,
    kategori,
    harga,
    deskripsi,
    stokAwal
  });

  return res.status(201).json({
    sukses: true,
    pesan: `Menu "${menuBaru.nama}" berhasil ditambahkan dengan stok awal ${menuBaru.stok} porsi.`,
    menu: menuBaru,
    semuaMenu: menuModel.getAllMenu()
  });
}

/**
 * PATCH /api/pesanan/:nomorAntrean/status
 * US-03-5 & Mitigasi Risiko 3:
 * Staf mengonfirmasi nomor meja, memproses pesanan ("Sedang Diproses"),
 * atau menyelesaikan pesanan ("Siap Diantar"). Otomatis mengirim notifikasi ke pelanggan.
 */
function patchStatusPesananDapur(req, res) {
  const { nomorAntrean } = req.params;
  const { status } = req.body;

  const pesananTerbaru = orderModel.updateStatusPesanan(nomorAntrean, status);
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
}

/**
 * GET /api/sinkronisasi
 * US-02-2, US-03-3, US-03-4:
 * Mengirimkan data real-time antrean pesanan FIFO, status stok seluruh menu,
 * peringkat terlaris, dan riwayat pencarian menu habis untuk sinkronisasi otomatis
 * antar layar Pelanggan, Staf Dapur, dan Pemilik.
 */
function getSinkronisasiData(req, res) {
  const antreanAktif = orderModel.getAntreanAktifFIFO().map((p) => ({
    ...p,
    labelWaktuTunggu: hitungWaktuTunggu(p.waktuPesan)
  }));
  const riwayatSelesai = orderModel.getRiwayatPesananSelesai();
  const semuaMenu = menuModel.getAllMenu();
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
}

/**
 * GET /api/laporan/export-csv
 * US-02-5 & F-06:
 * Mengunduh rekap laporan penjualan menu paling laku dan pemakaian stok harian
 * dalam format CSV (kompatibel penuh dengan Microsoft Excel) dalam waktu < 5 detik.
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

  // Menambahkan BOM UTF-8 (\uFEFF) agar langsung rapi saat dibuka di Microsoft Excel
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
 * Pemeriksaan kesehatan server aplikasi Devtech.
 */
function getStatusSistem(req, res) {
  res.status(200).json({
    status: 'aktif',
    produk: appConfig.appName,
    versi: appConfig.version,
    waktu: new Date().toISOString()
  });
}

module.exports = {
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
