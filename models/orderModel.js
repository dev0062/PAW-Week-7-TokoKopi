/**
 * ============================================================================
 * FILE: models/orderModel.js
 * ============================================================================
 * Model Sequelize untuk Tabel `orders` di PostgreSQL (pgAdmin).
 * Menyimpan data pesanan meja, status antrean dapur FIFO, dan riwayat selesai.
 * ============================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const menuModel = require('./menuModel');

// ============================================================================
// 1. DEFINISI MODEL SEQUELIZE (`orders` table di PostgreSQL)
// ============================================================================
const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nomorAntrean: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    nomorMeja: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    namaPelanggan: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    sumberPesan: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'Chatbot Meja'
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    totalPorsi: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    totalHarga: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'Menunggu Konfirmasi'
    },
    terkonfirmasiMeja: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    waktuPesan: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    waktuUpdate: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    notifikasiTerbaru: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'orders',
    timestamps: true
  }
);

let urutanAntreanCounter = 104;

const initialOrders = [
  {
    id: 1,
    nomorAntrean: 'ANT-101',
    nomorMeja: '02',
    namaPelanggan: 'Pelanggan Meja 02',
    sumberPesan: 'Chatbot Meja',
    items: [
      {
        menuId: 1,
        kode: 'MN-01',
        nama: 'Nasi Goreng Sei Sapi Asap',
        harga: 38000,
        qty: 2,
        subtotal: 76000
      },
      {
        menuId: 5,
        kode: 'MN-05',
        nama: 'Es Kopi Susu Aren Signature',
        harga: 24000,
        qty: 2,
        subtotal: 48000
      }
    ],
    catatan: 'Satu porsi nasi goreng tidak pedas.',
    totalPorsi: 4,
    totalHarga: 124000,
    status: 'Siap Diantar',
    terkonfirmasiMeja: true,
    waktuPesan: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    waktuUpdate: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    notifikasiTerbaru: 'Pesanan ANT-101 (Meja 02) sudah selesai dimasak dan siap diantar ke meja Anda.'
  },
  {
    id: 2,
    nomorAntrean: 'ANT-102',
    nomorMeja: '07',
    namaPelanggan: 'Evan Vijaya Putra',
    sumberPesan: 'Chatbot Meja',
    items: [
      {
        menuId: 2,
        kode: 'MN-02',
        nama: 'Mie Ayam Truffle Jamur',
        harga: 34000,
        qty: 1,
        subtotal: 34000
      },
      {
        menuId: 6,
        kode: 'MN-06',
        nama: 'Ice Caramel Sea Salt Latte',
        harga: 28000,
        qty: 1,
        subtotal: 28000
      }
    ],
    catatan: 'Kuah dipisah, es sedikit.',
    totalPorsi: 2,
    totalHarga: 62000,
    status: 'Sedang Diproses',
    terkonfirmasiMeja: true,
    waktuPesan: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    waktuUpdate: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    notifikasiTerbaru: 'Pesanan ANT-102 (Meja 07) sedang dimasak oleh staf dapur kami.'
  },
  {
    id: 3,
    nomorAntrean: 'ANT-103',
    nomorMeja: '11',
    namaPelanggan: 'Pelanggan Meja 11',
    sumberPesan: 'Chatbot Meja',
    items: [
      {
        menuId: 4,
        kode: 'MN-04',
        nama: 'Rice Bowl Chicken Katsu Curry',
        harga: 33000,
        qty: 2,
        subtotal: 66000
      },
      {
        menuId: 9,
        kode: 'MN-09',
        nama: 'Lychee Yakult Sparkler',
        harga: 25000,
        qty: 2,
        subtotal: 50000
      },
      {
        menuId: 10,
        kode: 'MN-10',
        nama: 'Crispy Truffle Parmesan Fries',
        harga: 26000,
        qty: 1,
        subtotal: 26000
      }
    ],
    catatan: 'Saus kari tuang langsung.',
    totalPorsi: 5,
    totalHarga: 142000,
    status: 'Menunggu Konfirmasi',
    terkonfirmasiMeja: false,
    waktuPesan: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    waktuUpdate: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    notifikasiTerbaru: 'Pesanan ANT-103 diterima di layar dapur untuk Meja 11 dan menunggu giliran masak.'
  }
];

let daftarPesanan = initialOrders.map((o) => ({ ...o }));
let isOrderDbConnected = false;

async function initOrderTable() {
  try {
    await Order.sync({ alter: true });
    const count = await Order.count();
    if (count === 0) {
      for (const item of initialOrders) {
        await Order.create(item);
      }
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 1), true);`);
      console.log('[Sequelize] 3 data awal Pesanan berhasil di-seed ke tabel PostgreSQL "orders".');
    } else {
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 1), true);`);
    }
    const rows = await Order.findAll({ order: [['id', 'ASC']] });
    daftarPesanan = rows.map((r) => r.toJSON());
    urutanAntreanCounter = 101 + daftarPesanan.length;
    isOrderDbConnected = true;
    console.log(`[Sequelize] Tabel "orders" tersinkronisasi (${daftarPesanan.length} baris di PostgreSQL).`);
  } catch (err) {
    isOrderDbConnected = false;
    console.warn('[Sequelize] Gagal sinkronisasi tabel "orders":', err.message);
  }
}

async function buatPesananBaru({
  nomorMeja,
  namaPelanggan,
  items,
  catatan = '',
  sumberPesan = 'Chatbot Meja'
}) {
  const mejaBersih = String(nomorMeja || '').trim().padStart(2, '0');
  const angkaMeja = Number(mejaBersih);
  if (!angkaMeja || angkaMeja < 1 || angkaMeja > 50) {
    return {
      sukses: false,
      pesanError: 'Nomor meja tidak valid. Pastikan Anda memilih nomor meja tempat Anda duduk saat ini.'
    };
  }

  const hasilStok = menuModel.validasiDanKurangiStok(items);
  if (!hasilStok.sukses) {
    const rekomendasiPengganti = menuModel.getRekomendasiTerlarisTersedia(3);
    return {
      sukses: false,
      pesanError: hasilStok.pesanError,
      rekomendasiPengganti
    };
  }

  const detailItem = hasilStok.detailItem;
  const totalPorsi = detailItem.reduce((acc, cur) => acc + cur.qty, 0);
  const totalHarga = detailItem.reduce((acc, cur) => acc + cur.subtotal, 0);

  const kodeAntrean = `ANT-${urutanAntreanCounter++}`;
  const sekarangISO = new Date().toISOString();

  const payloadBaru = {
    nomorAntrean: kodeAntrean,
    nomorMeja: mejaBersih,
    namaPelanggan: String(namaPelanggan || `Pelanggan Meja ${mejaBersih}`).trim(),
    sumberPesan,
    items: detailItem,
    catatan: String(catatan || '-').trim(),
    totalPorsi,
    totalHarga,
    status: 'Menunggu Konfirmasi',
    terkonfirmasiMeja: false,
    waktuPesan: sekarangISO,
    waktuUpdate: sekarangISO,
    notifikasiTerbaru: `Pesanan ${kodeAntrean} berhasil diteruskan ke dapur untuk Meja ${mejaBersih}.`
  };

  if (isOrderDbConnected) {
    try {
      const created = await Order.create(payloadBaru);
      const plain = created.toJSON();
      daftarPesanan.push(plain);
      return { sukses: true, pesanan: plain };
    } catch (e) {
      console.warn('[Sequelize] Gagal insert pesanan ke DB:', e.message);
    }
  }

  const pesananFallback = {
    id: daftarPesanan.length + 1,
    ...payloadBaru
  };
  daftarPesanan.push(pesananFallback);
  return { sukses: true, pesanan: pesananFallback };
}

function getAntreanAktifFIFO() {
  return daftarPesanan
    .filter((p) => p.status !== 'Siap Diantar')
    .sort((a, b) => new Date(a.waktuPesan).getTime() - new Date(b.waktuPesan).getTime());
}

function getRiwayatPesananSelesai() {
  return daftarPesanan
    .filter((p) => p.status === 'Siap Diantar')
    .sort((a, b) => new Date(b.waktuUpdate).getTime() - new Date(a.waktuUpdate).getTime());
}

function getAllPesanan() {
  return [...daftarPesanan];
}

function getPesananByNomorAntrean(nomorAntrean) {
  if (!nomorAntrean) return null;
  const targetKode = String(nomorAntrean).trim().toUpperCase();
  return daftarPesanan.find((p) => p.nomorAntrean.toUpperCase() === targetKode) || null;
}

function getPesananByMeja(nomorMeja) {
  const mejaBersih = String(nomorMeja || '').trim().padStart(2, '0');
  return daftarPesanan
    .filter((p) => p.nomorMeja === mejaBersih)
    .sort((a, b) => new Date(b.waktuPesan).getTime() - new Date(a.waktuPesan).getTime());
}

async function updateStatusPesanan(nomorAntrean, statusBaru) {
  const pesanan = getPesananByNomorAntrean(nomorAntrean);
  if (!pesanan) return null;

  const statusValid = ['Menunggu Konfirmasi', 'Sedang Diproses', 'Siap Diantar'];
  if (!statusValid.includes(statusBaru)) return null;

  pesanan.status = statusBaru;
  pesanan.terkonfirmasiMeja = true;
  pesanan.waktuUpdate = new Date().toISOString();

  if (statusBaru === 'Sedang Diproses') {
    pesanan.notifikasiTerbaru = `Pembaruan Dapur: Pesanan ${pesanan.nomorAntrean} (Meja ${pesanan.nomorMeja}) telah dikonfirmasi staf dan sedang dimasak.`;
  } else if (statusBaru === 'Siap Diantar') {
    pesanan.notifikasiTerbaru = `Pesanan Siap: Pesanan ${pesanan.nomorAntrean} (Meja ${pesanan.nomorMeja}) sudah selesai dimasak dan sedang diantar ke meja Anda.`;
  }

  if (isOrderDbConnected) {
    try {
      await Order.update(
        {
          status: pesanan.status,
          terkonfirmasiMeja: pesanan.terkonfirmasiMeja,
          waktuUpdate: pesanan.waktuUpdate,
          notifikasiTerbaru: pesanan.notifikasiTerbaru
        },
        { where: { nomorAntrean: pesanan.nomorAntrean } }
      );
    } catch (e) {
      console.warn('[Sequelize] Gagal update status pesanan di DB:', e.message);
    }
  }

  return pesanan;
}

module.exports = {
  Order,
  initOrderTable,
  buatPesananBaru,
  getAntreanAktifFIFO,
  getRiwayatPesananSelesai,
  getAllPesanan,
  getPesananByNomorAntrean,
  getPesananByMeja,
  updateStatusPesanan
};
